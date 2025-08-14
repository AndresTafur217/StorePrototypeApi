const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');

function calcularEstado(stock) {
  if (stock === 0) return 'agotado';
  if (stock < 10) return 'casi agotado';
  return 'disponible';
}

// Helpers
const uniq = arr => [...new Set((arr || []).filter(Boolean))];

async function verifyIdsExist(tableName, ids) {
  const rows = await fileManager.readTable(tableName);
  const set = new Set(rows.map(r => r.id));
  return ids.every(id => set.has(id));
}

async function hydrateProducts(products) {
  const [types, areas, specs, pt, pa, ps] = await Promise.all([
    fileManager.readTable('types'),
    fileManager.readTable('areas'),
    fileManager.readTable('specifications'),
    fileManager.readTable('product_types'),
    fileManager.readTable('product_areas'),
    fileManager.readTable('product_specifications'),
  ]);

  const typeById = new Map(types.map(t => [t.id, t]));
  const areaById = new Map(areas.map(a => [a.id, a]));
  const specById = new Map(specs.map(s => [s.id, s]));

  const typesByProduct = new Map();
  const areasByProduct = new Map();
  const specsByProduct = new Map();

  for (const link of pt) {
    if (!typesByProduct.has(link.productId)) typesByProduct.set(link.productId, []);
    const t = typeById.get(link.typeId);
    if (t) typesByProduct.get(link.productId).push({ id: t.id, nombre: t.nombre });
  }
  for (const link of pa) {
    if (!areasByProduct.has(link.productId)) areasByProduct.set(link.productId, []);
    const a = areaById.get(link.areaId);
    if (a) areasByProduct.get(link.productId).push({ id: a.id, nombre: a.nombre });
  }
  for (const link of ps) {
    if (!specsByProduct.has(link.productId)) specsByProduct.set(link.productId, []);
    const s = specById.get(link.specificationId);
    if (s) specsByProduct.get(link.productId).push({ id: s.id, nombre: s.nombre, valor: s.valor });
  }

  return products.map(p => ({
    ...p,
    tipos: typesByProduct.get(p.id) || [],
    areas: areasByProduct.get(p.id) || [],
    especificaciones: specsByProduct.get(p.id) || [],
  }));
}

const productController = {
  async addProduct(req, res) {
    try {
      // Asegurar tablas
      await Promise.all([
        fileManager.ensureTable('products'),
        fileManager.ensureTable('types'),
        fileManager.ensureTable('areas'),
        fileManager.ensureTable('specifications'),
        fileManager.ensureTable('product_types'),
        fileManager.ensureTable('product_areas'),
        fileManager.ensureTable('product_specifications'),
      ]);

      const {
        nombre,
        descripcion,
        precio,
        stock = 0,
        tipoIds = [],          // array de IDs de 'types'
        areaIds = [],          // array de IDs de 'areas'
        especificaciones = [], // array de IDs de 'specifications'
      } = req.body;

      if (!nombre || !descripcion || precio == null) {
        return res.status(400).json(errorResponse('nombre, descripcion y precio son obligatorios'));
      }

      const tipos = uniq(tipoIds);
      const areas = uniq(areaIds);
      const specs = uniq(especificaciones);

      // Validar existencia de IDs referenciados
      if (tipos.length && !(await verifyIdsExist('types', tipos))) {
        return res.status(400).json(errorResponse('Algún typeId no existe'));
      }
      if (areas.length && !(await verifyIdsExist('areas', areas))) {
        return res.status(400).json(errorResponse('Algún areaId no existe'));
      }
      if (specs.length && !(await verifyIdsExist('specifications', specs))) {
        return res.status(400).json(errorResponse('Algún specificationId no existe'));
      }

      const newProduct = {
        id: generateId(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: Number(precio),
        stock: Number(stock) || 0,
        estado: calcularEstado(Number(stock) || 0),
        vendedor: req.user?.id || null, // requiere auth middleware
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const products = await fileManager.readTable('products');
      products.push(newProduct);
      await fileManager.writeTable('products', products);

      // Insertar relaciones
      const [pt, pa, ps] = await Promise.all([
        fileManager.readTable('product_types'),
        fileManager.readTable('product_areas'),
        fileManager.readTable('product_specifications'),
      ]);

      for (const tId of tipos) pt.push({ productId: newProduct.id, typeId: tId });
      for (const aId of areas) pa.push({ productId: newProduct.id, areaId: aId });
      for (const sId of specs) ps.push({ productId: newProduct.id, specificationId: sId });

      await Promise.all([
        fileManager.writeTable('product_types', pt),
        fileManager.writeTable('product_areas', pa),
        fileManager.writeTable('product_specifications', ps),
      ]);

      const [enriched] = await hydrateProducts([newProduct]);

      await notificationsController.createNotification({
        body: {
          usuarioId: newUser.id,
          mensaje: `Tu producto "${nombre}" se ha publicado correctamente`,
          tipo: 'success'
        }
      }, { status: () => ({ json: () => {} }) });

      return res.status(201).json(successResponse(enriched, 'Producto agregado exitosamente'));
    } catch (error) {
      console.error('Error agregando producto', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async getProducts(req, res) {
    try {
      const products = await fileManager.readTable('products');
      const enriched = await hydrateProducts(products);
      return res.json(successResponse(enriched, `${enriched.length} productos obtenidos`));
    } catch (error) {
      console.error('Error obteniendo productos', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const products = await fileManager.readTable('products');
      const product = products.find(p => p.id === id);

      if (!product) return res.status(404).json(errorResponse('Producto no encontrado'));

      const [enriched] = await hydrateProducts([product]);
      return res.json(successResponse(enriched, 'Producto obtenido exitosamente'));
    } catch (error) {
      console.error('Error obteniendo producto por id', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre, descripcion, precio, stock,
        tipoIds, areaIds, especificaciones,
      } = req.body;

      const products = await fileManager.readTable('products');
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json(errorResponse('Producto no encontrado'));

      const current = products[idx];

      const newStock = (stock !== undefined) ? Number(stock) : current.stock;
      const updated = {
        ...current,
        nombre: nombre !== undefined ? String(nombre).trim() : current.nombre,
        descripcion: descripcion !== undefined ? String(descripcion).trim() : current.descripcion,
        precio: precio !== undefined ? Number(precio) : current.precio,
        stock: newStock,
        estado: calcularEstado(newStock),
        updatedAt: new Date().toISOString(),
      };

      products[idx] = updated;
      await fileManager.writeTable('products', products);

      // Actualizar relaciones SOLO si se envían
      if (Array.isArray(tipoIds) || Array.isArray(areaIds) || Array.isArray(especificaciones)) {
        await Promise.all([
          fileManager.ensureTable('product_types'),
          fileManager.ensureTable('product_areas'),
          fileManager.ensureTable('product_specifications'),
          fileManager.ensureTable('types'),
          fileManager.ensureTable('areas'),
          fileManager.ensureTable('specifications'),
        ]);

        if (Array.isArray(tipoIds)) {
          const tipos = uniq(tipoIds);
          if (!(await verifyIdsExist('types', tipos))) {
            return res.status(400).json(errorResponse('Algún typeId no existe'));
          }
          const pt = await fileManager.readTable('product_types');
          const filtered = pt.filter(link => link.productId !== id);
          for (const tId of tipos) filtered.push({ productId: id, typeId: tId });
          await fileManager.writeTable('product_types', filtered);
        }

        if (Array.isArray(areaIds)) {
          const areas = uniq(areaIds);
          if (!(await verifyIdsExist('areas', areas))) {
            return res.status(400).json(errorResponse('Algún areaId no existe'));
          }
          const pa = await fileManager.readTable('product_areas');
          const filtered = pa.filter(link => link.productId !== id);
          for (const aId of areas) filtered.push({ productId: id, areaId: aId });
          await fileManager.writeTable('product_areas', filtered);
        }

        if (Array.isArray(especificaciones)) {
          const specs = uniq(especificaciones);
          if (!(await verifyIdsExist('specifications', specs))) {
            return res.status(400).json(errorResponse('Algún specificationId no existe'));
          }
          const ps = await fileManager.readTable('product_specifications');
          const filtered = ps.filter(link => link.productId !== id);
          for (const sId of specs) filtered.push({ productId: id, specificationId: sId });
          await fileManager.writeTable('product_specifications', filtered);
        }
      }

      const [enriched] = await hydrateProducts([updated]);
      return res.status(200).json(successResponse(enriched, 'Producto actualizado exitosamente'));
    } catch (error) {
      console.error('Error actualizando producto', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const products = await fileManager.readTable('products');
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json(errorResponse('Producto no encontrado'));

      products.splice(idx, 1);
      await fileManager.writeTable('products', products);

      // Borrar relaciones
      const [pt, pa, ps] = await Promise.all([
        fileManager.readTable('product_types'),
        fileManager.readTable('product_areas'),
        fileManager.readTable('product_specifications'),
      ]);

      await Promise.all([
        fileManager.writeTable('product_types', pt.filter(l => l.productId !== id)),
        fileManager.writeTable('product_areas', pa.filter(l => l.productId !== id)),
        fileManager.writeTable('product_specifications', ps.filter(l => l.productId !== id)),
      ]);

      // 200 con mensaje (no 204 con body)
      return res.status(200).json(successResponse(null, 'Producto eliminado exitosamente'));
    } catch (error) {
      console.error('Error eliminando producto:', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async searchProduct(req, res) {
    try {
      const { term } = req.params;
      const q = String(term || '').toLowerCase();

      const [products, types, areas, specs, pt, pa, ps] = await Promise.all([
        fileManager.readTable('products'),
        fileManager.readTable('types'),
        fileManager.readTable('areas'),
        fileManager.readTable('specifications'),
        fileManager.readTable('product_types'),
        fileManager.readTable('product_areas'),
        fileManager.readTable('product_specifications'),
      ]);

      const typeById = new Map(types.map(t => [t.id, t]));
      const areaById = new Map(areas.map(a => [a.id, a]));
      const specById = new Map(specs.map(s => [s.id, s]));

      // Índices inversos por producto
      const namesByProduct = new Map(); // {productId: { tipos:[], areas:[], specs:[] }}
      for (const p of products) namesByProduct.set(p.id, { tipos: [], areas: [], specs: [] });

      for (const link of pt) {
        const t = typeById.get(link.typeId);
        if (t && namesByProduct.has(link.productId)) namesByProduct.get(link.productId).tipos.push(t.nombre?.toLowerCase() || '');
      }
      for (const link of pa) {
        const a = areaById.get(link.areaId);
        if (a && namesByProduct.has(link.productId)) namesByProduct.get(link.productId).areas.push(a.nombre?.toLowerCase() || '');
      }
      for (const link of ps) {
        const s = specById.get(link.specificationId);
        if (s && namesByProduct.has(link.productId)) {
          namesByProduct.get(link.productId).specs.push(
            [s.nombre, s.valor].filter(Boolean).join(' ').toLowerCase()
          );
        }
      }

      const filtered = products.filter(p => {
        const bag = [
          p.nombre, p.descripcion, p.estado, String(p.precio), String(p.vendedor)
        ].filter(Boolean).map(x => String(x).toLowerCase());

        const rel = namesByProduct.get(p.id);
        if (rel) {
          bag.push(...rel.tipos, ...rel.areas, ...rel.specs);
        }

        return bag.some(text => text.includes(q));
      });

      const enriched = await hydrateProducts(filtered);
      return res.json(successResponse(enriched, `${enriched.length} productos encontrados`));
    } catch (error) {
      console.error('Error buscando producto:', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }
};

module.exports = productController;