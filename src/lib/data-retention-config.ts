export interface DataRetentionPolicy {
  invoicesDays: number;
  systemLogsDays: number;
  coreEntitiesRetention: 'PERMANENT';
}

export const DATA_RETENTION_CONFIG: DataRetentionPolicy = {
  invoicesDays: 30, // مدة الاحتفاظ بالفواتير وإيصالات الكاشير: 30 يوماً فقط
  systemLogsDays: 90, // مدة الاحتفاظ بسجلات الموقع والعمليات المنتهية: 90 يوماً فقط
  coreEntitiesRetention: 'PERMANENT' // المنتجات والتصنيفات والبيانات الرئيسية دائمة للأبد
};
