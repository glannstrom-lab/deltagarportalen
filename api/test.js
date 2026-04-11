module.exports = (req, res) => {
  res.status(200).json({
    message: 'API fungerar!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
