import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import SettingService from './setting.services';

const GetSetting = catchAsync(async (req, res) => {
  const result = await SettingService.GetSetting(req.user?.shop_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Restaurant settings retrieved successfully',
    data: result,
  });
});

const UpdateSetting = catchAsync(async (req, res) => {
  const result = await SettingService.UpdateSetting(
    req.user?.shop_id,
    req.body,
    req.file,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Restaurant settings updated successfully',
    data: result,
  });
});

const SettingController = {
  GetSetting,
  UpdateSetting,
};

export default SettingController;
