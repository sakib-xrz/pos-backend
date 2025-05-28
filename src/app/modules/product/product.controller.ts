import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ProductService, {
  CreateProductPayload,
  GetProductsQuery,
} from './product.services';
import AppError from '../../errors/AppError';

const GetProducts = catchAsync(async (req, res) => {
  const userShopId =
    req.user.role === 'SUPER_ADMIN' ? undefined : req.user.shop_id;
  const result = await ProductService.GetProducts(
    req.query as GetProductsQuery,
    userShopId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Products retrieved successfully',
    meta: result.meta,
    data: result.products,
  });
});

const CreateProduct = catchAsync(async (req, res) => {
  if (req.user.role === 'SUPER_ADMIN') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Super admin cannot create products',
    );
  }

  const result = await ProductService.CreateProduct(
    req.body as CreateProductPayload,
    req.user.shop_id!,
    req.file,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Product created successfully',
    data: result,
  });
});

const UpdateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if super admin is trying to update product
  if (req.user.role === 'SUPER_ADMIN') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Super admin cannot update products',
    );
  }

  const result = await ProductService.UpdateProduct(
    id,
    req.body,
    req.file,
    req.user,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product updated successfully',
    data: result,
  });
});

const UpdateProductImage = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Product image is required',
    });
  }

  const result = await ProductService.UpdateProductImage(id, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product image updated successfully',
    data: result,
  });
});

const DeleteProductImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ProductService.DeleteProductImage(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product image deleted successfully',
    data: result,
  });
});

const DeleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ProductService.DeleteProduct(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product deleted successfully',
  });
});

const ToggleAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { is_available } = req.body;
  const result = await ProductService.ToggleAvailability(id, is_available);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Product ${is_available ? 'marked as available' : 'marked as unavailable'} successfully`,
    data: result,
  });
});

const ProductController = {
  GetProducts,
  CreateProduct,
  UpdateProduct,
  UpdateProductImage,
  DeleteProductImage,
  DeleteProduct,
  ToggleAvailability,
};

export default ProductController;
