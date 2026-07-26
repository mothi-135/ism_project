const UserModel = require('../models/UserModel');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.authenticate(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // In a real app, you would sign a JWT token here.
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
