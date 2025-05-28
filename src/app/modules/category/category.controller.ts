import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import CategoryService from './category.services';
import AppError from '../../errors/AppError';

const GetCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.GetCategories(req.query, req.user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.categories,
  });
});

const CreateCategory = catchAsync(async (req, res) => {
  if (req.user.role === 'SUPER_ADMIN') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Super admin cannot create categories',
    );
  }

  const user = req.user;

  const result = await CategoryService.CreateCategory(req.body, user, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Category created successfully',
    data: result,
  });
});

const UpdateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.UpdateCategory(
    id,
    req.body,
    req.file,
    req.user,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category updated successfully',
    data: result,
  });
});

const DeleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CategoryService.DeleteCategory(id, req.user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category deleted successfully',
  });
});

const CategoryController = {
  GetCategories,
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
};

export default CategoryController;
