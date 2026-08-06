// Validates req.body against a zod schema before it reaches the controller.
// On success, req.body is replaced with the parsed (trimmed/coerced) data.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join(', ')
      res.status(400)
      return next(new Error(message))
    }
    req.body = result.data
    next()
  }
}