import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const GetSetting = async () => {
  // Check if any setting exists
  const setting = await prisma.setting.findFirst({
    select: {
      id: true,
      display_name: true,
      address: true,
      phone_number: true,
      email: true,
      logo_url: true,
      receipt_header_text: true,
      receipt_footer_text: true,
      show_logo_on_receipt: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!setting) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Restaurant settings not found. Please create initial settings.',
    );
  }

  return setting;
};

const UpdateSetting = async (payload: {
  display_name?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  logo_url?: string;
  receipt_header_text?: string;
  receipt_footer_text?: string;
  show_logo_on_receipt?: boolean;
  shop_id: string;
}) => {
  // Check if any setting exists
  const existingSetting = await prisma.setting.findFirst();

  if (!existingSetting) {
    // If no setting exists, create a new one with required fields
    const defaultSetting = {
      display_name: payload.display_name || 'My Restaurant',
      address: payload.address || 'Address not set',
      phone_number: payload.phone_number || '000-000-0000',
      email: payload.email || 'contact@restaurant.com',
      logo_url: payload.logo_url || '',
      receipt_header_text:
        payload.receipt_header_text || 'Welcome to our restaurant!',
      receipt_footer_text:
        payload.receipt_footer_text || 'Thank you for your visit!',
      show_logo_on_receipt: payload.show_logo_on_receipt ?? true,
      shop_id: payload.shop_id,
    };

    const newSetting = await prisma.setting.create({
      data: defaultSetting,
      select: {
        id: true,
        display_name: true,
        address: true,
        phone_number: true,
        email: true,
        logo_url: true,
        receipt_header_text: true,
        receipt_footer_text: true,
        show_logo_on_receipt: true,
        created_at: true,
        updated_at: true,
      },
    });

    return newSetting;
  }

  // Update existing setting
  const updatedSetting = await prisma.setting.update({
    where: { id: existingSetting.id },
    data: {
      ...payload,
      updated_at: new Date(),
    },
    select: {
      id: true,
      display_name: true,
      address: true,
      phone_number: true,
      email: true,
      logo_url: true,
      receipt_header_text: true,
      receipt_footer_text: true,
      show_logo_on_receipt: true,
      created_at: true,
      updated_at: true,
    },
  });

  return updatedSetting;
};

const SettingService = {
  GetSetting,
  UpdateSetting,
};

export default SettingService;
