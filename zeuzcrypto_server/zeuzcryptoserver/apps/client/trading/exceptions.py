class TradingException(Exception):
    """Base exception for trading system"""
    pass


class InsufficientFundsException(TradingException):
    """Raised when user has insufficient funds for trade"""
    pass


class InvalidTradeException(TradingException):
    """Raised when trade parameters are invalid"""
    pass


class MarketClosedException(TradingException):
    """Raised when trying to trade in closed market"""
    pass


class PositionLimitExceededException(TradingException):
    """Raised when position limits are exceeded"""
    pass


class LeverageLimitExceededException(TradingException):
    """Raised when leverage limits are exceeded"""
    pass


# validators.py - Custom field validators
from django.core.exceptions import ValidationError
from decimal import Decimal


def validate_positive_decimal(value):
    """Validate that decimal value is positive"""
    if value <= 0:
        raise ValidationError('Value must be positive')


def validate_leverage(value):
    """Validate leverage limits"""
    if value < 1 or value > 50:
        raise ValidationError('Leverage must be between 1 and 50')


def validate_quantity_precision(value):
    """Validate quantity precision (max 8 decimal places)"""
    if value.as_tuple().exponent < -8:
        raise ValidationError('Quantity precision cannot exceed 8 decimal places')
