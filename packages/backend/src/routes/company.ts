import express from "express";
import { fillCompanyInput } from "../ats/ats";
import { addCompany, validateCompanyInput } from "../db/company";

export const companyRouter = express.Router();

companyRouter.put("/", async (req, res, next) => {
  try {
    const input = validateCompanyInput(req.body);
    const company = await fillCompanyInput(input);

    await addCompany(company);

    res.send("Success");
  } catch (error: any) {
    next(error);
  }
});
