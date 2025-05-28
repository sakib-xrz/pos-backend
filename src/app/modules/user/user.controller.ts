import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import UserService from './user.services';

const GetUsers = catchAsync(async (req, res) => {
  const result = await UserService.GetUsers(req.query, req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.users,
  });
});

const CreateUser = catchAsync(async (req, res) => {
  const result = await UserService.CreateUser(req.body, req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'User created successfully',
    data: result,
  });
});

const UpdateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.UpdateUser(id, req.body, req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const ResetPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  await UserService.ResetPassword(id, new_password, req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Password reset successfully',
  });
});

const DeleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  await UserService.DeleteUser(id, req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User deleted successfully',
  });
});

const UserController = {
  GetUsers,
  CreateUser,
  UpdateUser,
  ResetPassword,
  DeleteUser,
};

export default UserController;
