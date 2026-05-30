from .models import Book


def get_book_inventory_stats():
    total = Book.objects.count()
    in_stock = Book.objects.filter(quantity_available__gt=0).count()
    out_of_stock = total - in_stock
    return {
        "total_books": total,
        "books_in_stock": in_stock,
        "books_out_of_stock": out_of_stock,
    }
