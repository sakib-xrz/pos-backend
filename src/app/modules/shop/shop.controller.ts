import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ShopService, {
  GetShopsQuery,
  CreateShopPayload,
  UpdateShopPayload,
} from './shop.services';

const GetShops = catchAsync(async (req, res) => {
  const result = await ShopService.GetShops(req.query as GetShopsQuery);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Shops retrieved successfully',
    meta: result.meta,
    data: result.shops,
  });
});

const GetShopById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ShopService.GetShopById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Shop retrieved successfully',
    data: result,
  });
});

const CreateShop = catchAsync(async (req, res) => {
  const result = await ShopService.CreateShop(req.body as CreateShopPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Shop created successfully',
    data: result,
  });
});

const UpdateShop = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ShopService.UpdateShop(
    id,
    req.body as UpdateShopPayload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Shop updated successfully',
    data: result,
  });
});

const UpdateSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ShopService.UpdateSubscription(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Shop subscription updated successfully',
    data: result,
  });
});

const DeleteShop = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ShopService.DeleteShop(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Shop deleted successfully',
  });
});

const ShopController = {
  GetShops,
  GetShopById,
  CreateShop,
  UpdateShop,
  UpdateSubscription,
  DeleteShop,
};

export default ShopController;
