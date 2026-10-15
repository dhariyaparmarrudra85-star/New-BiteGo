import Address from "../models/Address.js";

// @desc    Get all addresses for logged-in user
// @route   GET /api/users/addresses
// @access  Private
export const getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching addresses.",
      error: error.message,
    });
  }
};

// @desc    Add new delivery address
// @route   POST /api/users/addresses
// @access  Private
export const createAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      houseFlat,
      area,
      landmark,
      city,
      state,
      pincode,
      type,
      isDefault,
    } = req.body;

    if (!fullName || !phone || !houseFlat || !area) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, house/flat, and area are required.",
      });
    }

    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    // If first address, make it default automatically
    const existingCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = isDefault || existingCount === 0;

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      houseFlat,
      area,
      landmark: landmark || "",
      city: city || "Ahmedabad",
      state: state || "Gujarat",
      pincode: pincode || "380054",
      type: type ? (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) : "Home",
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully.",
      address,
    });
  } catch (error) {
    console.error("Create Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating address.",
      error: error.message,
    });
  }
};

// @desc    Update delivery address
// @route   PUT /api/users/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const updatePayload = { ...req.body };
    if (updatePayload.type) {
      updatePayload.type =
        updatePayload.type.charAt(0).toUpperCase() +
        updatePayload.type.slice(1).toLowerCase();
    }

    const updated = await Address.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Address updated successfully.",
      address: updated,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating address.",
      error: error.message,
    });
  }
};

// @desc    Delete delivery address
// @route   DELETE /api/users/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    res.json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting address.",
      error: error.message,
    });
  }
};

// @desc    Set default delivery address
// @route   PATCH /api/users/addresses/:id/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } }
    );

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    res.json({
      success: true,
      message: "Default address updated.",
      address,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error setting default address.",
      error: error.message,
    });
  }
};
