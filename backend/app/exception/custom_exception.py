from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        error: str,
        code: str
    ):
        self.error = error
        self.code = code

        super().__init__(
            status_code=status_code,
            detail=error
        )