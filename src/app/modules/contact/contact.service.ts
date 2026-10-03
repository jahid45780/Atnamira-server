import { Contact } from "./contact.model";
import { IContact } from "./contact.interface";

const getContact = async () => {
  const contact = await Contact.findOne();

  return contact;
};

const createContact = async (payload: IContact) => {
  const existingContact = await Contact.findOne();

  if (existingContact) {
    throw new Error("Contact information already exists");
  }

  const contact = await Contact.create(payload);

  return contact;
};

const updateContact = async (payload: Partial<IContact>) => {
  const existingContact = await Contact.findOne();

  if (!existingContact) {
    const contact = await Contact.create(payload);

    return contact;
  }

  const contact = await Contact.findByIdAndUpdate(
    existingContact._id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  return contact;
};

export const ContactService = {
  getContact,
  createContact,
  updateContact,
};