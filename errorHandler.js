function errorHandler(err,req, res,next) {
    res.status(err.code || 500)
    res.send({
    error: {
      status: err.code || 500,
      message: err.message || "something went wrong",
    }
    })
}
module.exports = {
  errorHandler
}

