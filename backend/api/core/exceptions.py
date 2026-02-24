from fastapi import HTTPException


class ProductNotFoundError(HTTPException):
    def __init__(self, product_id: str):
        super().__init__(status_code=404, detail=f"Ürün bulunamadı: {product_id}")


class DatabaseError(HTTPException):
    def __init__(self, message: str):
        super().__init__(status_code=500, detail=f"Veritabanı hatası: {message}")
