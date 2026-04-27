export type AssetStatus = 'Tốt' | 'Mới' | 'Đang mượn' | 'Cần bảo trì';

export interface AssetItem {
  id: string;
  name: string;
  quantity: number;
  status: AssetStatus;
  holder: string;
  category: string;
}

export const assetSeedData: AssetItem[] = [
  { id: 'TS-001', name: 'Standee CLB (Loại X)', quantity: 2, status: 'Tốt', holder: 'Kho LCH', category: 'Sự kiện' },
  { id: 'TS-002', name: 'Áo thun dự phòng (Size L)', quantity: 5, status: 'Mới', holder: 'Ban Vận Hành', category: 'Đồng phục' },
  { id: 'TS-003', name: 'Microphone thu âm', quantity: 1, status: 'Đang mượn', holder: 'Hà Quốc Toản', category: 'Thiết bị âm thanh' },
  { id: 'TS-004', name: 'Đèn livestream mini', quantity: 2, status: 'Cần bảo trì', holder: 'Kho CLB', category: 'Thiết bị ánh sáng' }
];
