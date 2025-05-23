import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import CategoryService from './category.services';

const GetCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.GetCategories(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.categories,
  });
});

const CreateCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.CreateCategory(req.body, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Category created successfully',
    data: result,
  });
});

const UpdateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.UpdateCategory(id, req.body, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category updated successfully',
    data: result,
  });
});

const UpdateCategoryImage = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Category image is required',
    });
  }

  const result = await CategoryService.UpdateCategoryImage(id, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category image updated successfully',
    data: result,
  });
});

const DeleteCategoryImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.DeleteCategoryImage(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category image deleted successfully',
    data: result,
  });
});

const DeleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CategoryService.DeleteCategory(id);

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
  UpdateCategoryImage,
  DeleteCategoryImage,
  DeleteCategory,
};

export default CategoryController;
