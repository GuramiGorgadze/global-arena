export const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, 
    });
    next();
  } catch (err) {
    return res.status(400).json({
      message: "ვალიდაციის შეცდომა",
      errors: err.errors, 
    });
  }
};