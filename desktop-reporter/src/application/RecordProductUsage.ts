import type {  IProductRepo  } from './interfaces';

export class RecordProductUsage {
  constructor(private productRepo: IProductRepo) {}

  async execute(productId: string, quantityUsed: number): Promise<void> {
    const product = await this.productRepo.getById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    product.stockQty -= quantityUsed;
    await this.productRepo.update(product);
  }
}
