// controllers/clinicController.js
const Clinic = require("../models/Clinic");
const Doctor = require("../models/Doctor");

exports.getClinics = async (req, res) => {
  try {
    // Lấy danh sách tất cả phòng khám
    const clinics = await Clinic.find().sort({ createdAt: -1 });

    // Với mỗi phòng khám → tìm danh sách bác sĩ đang hoạt động trong đó
    const clinicsWithDoctors = await Promise.all(
      clinics.map(async (clinic) => {
        const activeDoctors = await Doctor.find({
          clinic: clinic._id,
          status: 1, // chỉ lấy bác sĩ đang hoạt động
        })
          .select("fullName email phoneNumber specialty experience")
          .populate("specialty", "name"); // lấy tên chuyên khoa

        return {
          ...clinic.toObject(),
          doctors: activeDoctors, // gắn danh sách bác sĩ
        };
      })
    );

    return res.json({
      success: true,
      message: "Lấy danh sách phòng khám và bác sĩ thành công",
      data: clinicsWithDoctors,
    });
  } catch (error) {
    console.error("getClinics error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách phòng khám",
      error: error.message,
    });
  }
};

exports.createClinic = async (req, res) => {
  try {
    const { name, address, phone, description, specialties } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Tên và địa chỉ phòng khám là bắt buộc.",
      });
    }

    // Tạo mới phòng khám
    const newClinic = new Clinic({
      name,
      address,
      phone,
      description,
      specialties,
    });

    await newClinic.save();

    return res.status(201).json({
      success: true,
      message: "Tạo phòng khám thành công!",
      data: newClinic,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo phòng khám:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi tạo phòng khám.",
      error: error.message,
    });
  }
};

exports.getSpecialtiesByClinic = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id).populate(
      "specialties",
      "name description"
    );
    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng khám" });
    }

    res.json({
      success: true,
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        address: clinic.address,
      },
      specialties: clinic.specialties,
    });
  } catch (error) {
    console.error("getSpecialtiesByClinic error:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy chuyên khoa" });
  }
};
