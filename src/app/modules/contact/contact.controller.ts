import { Request, Response } from "express";
import { ContactService } from "./contact.service";
import { catchAsync } from "../../utils/catchAsync";
import { sentResponse } from "../../utils/sendResponse";

const getContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.getContact();

  sentResponse(res, {
    statusCode: 200,
    success: true,
    message: "Contact information retrieved successfully",
    data: result,
  });
});

const createContact = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ContactService.createContact(req.body);

    sentResponse(res, {
      statusCode: 201,
      success: true,
      message: "Contact information created successfully",
      data: result,
    });
  },
);

const updateContact = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ContactService.updateContact(req.body);

    sentResponse(res, {
      statusCode: 200,
      success: true,
      message: "Contact information updated successfully",
      data: result,
    });
  },
);

export const ContactController = {
  getContact,
  createContact,
  updateContact,
};