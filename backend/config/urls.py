from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(request):
    return JsonResponse({"status": "ok", "version": "1.0"})


urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/books/", include("apps.books.urls")),
    path("api/v1/cart/", include("apps.cart.urls")),
    path("api/v1/wishlist/", include("apps.wishlist.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/support/", include("apps.support.urls")),
    path("api/vapi/", include("apps.vapi_support.urls")),
]
