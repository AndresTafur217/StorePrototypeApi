const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Crear directorio data si no existe
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${DATA_DIR}`);
  }
};

const fileManager = {
  // Verificar que la tabla exista
  async ensureTable(tableName) {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    try {
      await fs.access(filePath);
    } catch {
      // Si el archivo no existe, lo agrega
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      console.log(`🆕 Tabla creada: ${tableName}.json`);
    }
  },

  // Leer tabla
  async readTable(tableName) {
    await this.ensureTable(tableName); // ← Auto-crea si no existe
    
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error leyendo ${tableName}:`, error);
      // Si hay error de parsing, devolver array vacío y recrear
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
  },

  // Escribir tabla
  async writeTable(tableName, data) {
    await this.ensureTable(tableName); // ← Auto-crea si no existe
    
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error escribiendo ${tableName}:`, error);
      throw error;
    }
  },
  
  // Agregar registro
  async addToTable(tableName, record) {
    const data = await this.readTable(tableName);
    data.push(record);
    await this.writeTable(tableName, data);
    return record;
  },

  // Actualizar registro
  async updateInTable(tableName, id, updates) {
    const data = await this.readTable(tableName);
    const index = data.findIndex(record => record.id === id);
    
    if (index === -1) {
      throw new Error('Registro no encontrado');
    }
    
    data[index] = { ...data[index], ...updates };
    await this.writeTable(tableName, data);
    return data[index];
  },

  // Eliminar registro
  async removeFromTable(tableName, id) {
    const data = await this.readTable(tableName);
    const index = data.findIndex(record => record.id === id);
    
    if (index === -1) {
      throw new Error('Registro no encontrado');
    }
    
    const deletedRecord = data.splice(index, 1)[0];
    await this.writeTable(tableName, data);
    return deletedRecord;
  },

  // Buscar registros
  async findInTable(tableName, filter) {
    const data = await this.readTable(tableName);
    
    if (typeof filter === 'function') {
      return data.filter(filter);
    }
    
    if (typeof filter === 'object') {
      return data.filter(record => {
        return Object.keys(filter).every(key => 
          record[key] === filter[key]
        );
      });
    }
    
    return data;
  },

  // Obtener todas las tablas disponibles
  async getAllTables() {
    await ensureDataDir();
    
    try {
      const files = await fs.readdir(DATA_DIR);
      const tables = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      return tables;
    } catch (error) {
      console.error('Error obteniendo tablas:', error);
      return [];
    }
  },

  // Verificar si una tabla existe
  async tableExists(tableName) {
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  // Eliminar tabla completa
  async deleteTable(tableName) {
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Tabla eliminada: ${tableName}.json`);
      return true;
    } catch (error) {
      console.error(`Error eliminando tabla ${tableName}:`, error);
      return false;
    }
  },

  // Hacer backup de una tabla
  async backupTable(tableName) {
    const data = await this.readTable(tableName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${tableName}_backup_${timestamp}`;
    
    await this.writeTable(backupName, data);
    console.log(`💾 Backup creado: ${backupName}.json`);
    return backupName;
  },

  // Obtener estadísticas de una tabla
  async getTableStats(tableName) {
    const data = await this.readTable(tableName);
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    
    try {
      const stats = await fs.stat(filePath);
      
      return {
        name: tableName,
        recordCount: data.length,
        fileSize: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
        exists: true
      };
    } catch (error) {
      return {
        name: tableName,
        recordCount: data.length,
        fileSize: 0,
        lastModified: new Date(),
        created: new Date(),
        exists: false
      };
    }
  },

  // Inicializar tablas con esquemas predefinidos
  async initializeTables(schemas = {}) {
    await ensureDataDir();
    
    const defaultSchemas = {
      users: [],
      products: [],
      categories: [],
      orders: []
    };
    
    const tablesToCreate = { ...defaultSchemas, ...schemas };
    
    for (const [tableName, initialData] of Object.entries(tablesToCreate)) {
      const exists = await this.tableExists(tableName);
      if (!exists) {
        await this.writeTable(tableName, initialData);
        console.log(`🆕 Tabla inicializada: ${tableName}.json`);
      }
    }
  }
};

module.exports = fileManager;