from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import create_razorpay_order, verify_razorpay_payment


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            data = create_razorpay_order(request.user)
            return Response(data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {"detail": "razorpay_order_id, razorpay_payment_id, and razorpay_signature required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = verify_razorpay_payment(
                razorpay_order_id, razorpay_payment_id, razorpay_signature
            )
            return Response(result)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
