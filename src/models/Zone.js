import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, { timestamps: true });

const Zone = mongoose.models.Zone || mongoose.model('Zone', zoneSchema);
export default Zone;
