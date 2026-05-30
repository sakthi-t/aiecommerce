from django.urls import path
from . import views

urlpatterns = [
    path("", views.BookListCreateView.as_view(), name="books-list"),
    path("<int:id>/", views.BookDetailView.as_view(), name="books-detail"),
    path("<int:id>/upload-image/", views.BookImageUploadView.as_view(), name="books-upload-image"),
    path("stats/", views.BookInventoryStatsView.as_view(), name="books-stats"),
]
