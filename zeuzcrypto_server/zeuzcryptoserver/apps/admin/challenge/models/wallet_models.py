# import uuid
# from decimal import Decimal
# from django.db import models
# from django.utils import timezone
# from apps.accounts.models import User

# class ChallengeWallet(models.Model):
#     """Virtual wallet for challenge trading"""

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     participation = models.OneToOneField(
#         'admin.UserChallengeParticipation', on_delete=models.CASCADE, related_name="wallet"
#     )

#     balance = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal("0"))
#     locked_balance = models.DecimalField(
#         max_digits=20, decimal_places=8, default=Decimal("0")
#     )

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "challenge_wallets"

#     def __str__(self):
#         return f"Challenge Wallet - {self.participation.user.email}"


# class ChallengeWalletTransaction(models.Model):
#     """Transaction history for challenge wallets"""

#     TRANSACTION_TYPES = [
#         ("DEPOSIT", "Initial Deposit"),
#         ("TRADE", "Trade Settlement"),
#         ("FEE", "Trading Fee"),
#         ("ADJUSTMENT", "Balance Adjustment"),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     wallet = models.ForeignKey(
#         ChallengeWallet, on_delete=models.CASCADE, related_name="transactions"
#     )

#     transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
#     amount = models.DecimalField(max_digits=20, decimal_places=8)

#     balance_before = models.DecimalField(max_digits=20, decimal_places=8)
#     balance_after = models.DecimalField(max_digits=20, decimal_places=8)

#     description = models.TextField(blank=True)
#     reference_id = models.UUIDField(null=True, blank=True)

#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         db_table = "challenge_wallet_transactions"
#         indexes = [
#             models.Index(fields=["wallet", "transaction_type"]),
#             models.Index(fields=["created_at"]),
#         ]

#     def __str__(self):
#         return f"{self.wallet.participation.user.email} - {self.transaction_type} - {self.amount}"
