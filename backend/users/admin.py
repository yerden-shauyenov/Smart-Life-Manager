from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from .models import User
from boards.models import Board, BoardMembership

admin.site.unregister(Group)

try:
    admin.site.unregister(OutstandingToken)
    admin.site.unregister(BlacklistedToken)
except admin.sites.NotRegistered:
    pass


class OwnedBoardsInline(admin.TabularInline):
    model = Board
    extra = 0
    fields = ('title', 'is_public', 'created_at')
    readonly_fields = ('created_at',)
    verbose_name = "Owned Board"
    verbose_name_plural = "Owned Boards"


class BoardMembershipsInline(admin.TabularInline):
    model = BoardMembership
    extra = 0
    fields = ('board', 'role', 'joined_at')
    readonly_fields = ('joined_at',)
    verbose_name = "Board Membership"
    verbose_name_plural = "Board Memberships"


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = [OwnedBoardsInline, BoardMembershipsInline]

    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    readonly_fields = ('last_login', 'date_joined')