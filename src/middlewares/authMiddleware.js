const jwt = require("jsonwebtoken");
const User = require("../models/User");

// protect nhận thêm allowedRoles (mặc định cho tất cả nếu không truyền)
const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lấy user từ DB và bỏ password
        req.user = await User.findById(decoded.id).select("-password");

        // Gắn role từ token (nếu có)
        if (decoded.role) {
          req.user.role = decoded.role;
        }

        // Nếu có quy định role thì check
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
          return res
            .status(403)
            .json({ message: "Bạn không có quyền truy cập" });
        }

        return next();
      } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Không có token, từ chối truy cập" });
    }
  };
};

module.exports = protect;
