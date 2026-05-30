from rest_framework.exceptions import APIException


class NotAdminError(APIException):
    status_code = 403
    default_detail = "Admin access required."
    default_code = "not_admin"
