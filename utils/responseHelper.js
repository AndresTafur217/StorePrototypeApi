const successResponse = (data, message = 'Operación exitosa', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta,
    timestamp: new Date().toISOString()
  };
};

const errorResponse = (message = 'Error en la operación', error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }
  
  return response;
};

const paginationMeta = (page, limit, total) => {
  return {
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPreviousPage: parseInt(page) > 1
    }
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginationMeta
};