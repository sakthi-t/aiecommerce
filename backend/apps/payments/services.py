import razorpay
from django.conf import settings
from apps.cart.models import Cart
from apps.orders.models import Order, OrderItem


def _get_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(user):
    cart = Cart.objects.get(user=user)
    items = cart.items.select_related("book").all()

    if not items.exists():
        raise ValueError("Cart is empty")

    total_paise = 0
    for item in items:
        book = item.book
        if book.quantity_available < item.quantity:
            raise ValueError(f"Not enough stock for {book.title}")
        total_paise += int(float(book.price_inr) * item.quantity * 100)

    client = _get_client()
    razorpay_order = client.order.create({
        "amount": total_paise,
        "currency": "INR",
        "receipt": f"order_{user.id}_{int(items.first().id if items.exists() else 0)}",
        "payment_capture": 1,
    })

    order = Order.objects.create(
        user=user,
        total_amount=total_paise / 100,
        status=Order.STATUS_PENDING,
    )

    for item in items:
        OrderItem.objects.create(
            order=order,
            book=item.book,
            book_title=item.book.title,
            book_price=item.book.price_inr,
            quantity=item.quantity,
        )
        item.book.quantity_available -= item.quantity
        item.book.save(update_fields=["quantity_available"])

    order.stripe_session_id = razorpay_order["id"]
    order.save(update_fields=["stripe_session_id"])

    cart.items.all().delete()

    return {
        "order_id": razorpay_order["id"],
        "amount": razorpay_order["amount"],
        "currency": razorpay_order["currency"],
        "key": settings.RAZORPAY_KEY_ID,
    }


def verify_razorpay_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    client = _get_client()
    params = {
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    }
    client.utility.verify_payment_signature(params)

    order = Order.objects.get(stripe_session_id=razorpay_order_id)
    if order.status != Order.STATUS_PAID:
        _fulfill_order(order)

    return {"status": "paid"}


def _fulfill_order(order):
    order.status = Order.STATUS_PAID
    order.save(update_fields=["status"])
