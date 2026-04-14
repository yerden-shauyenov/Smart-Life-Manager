from .models import Board, BoardRole, TaskStatus, TaskPriority, TaskType, BoardMembership, Sprint


def initialize_board_defaults(board):
    roles_data = [
        {'name': 'Administrator', 'can_manage_board': True, 'can_manage_members': True, 'can_create_tasks': True,
         'can_edit_tasks': True, 'can_delete_tasks': True},
        {'name': 'Scrum Master', 'can_manage_board': False, 'can_manage_members': True, 'can_create_tasks': True,
         'can_edit_tasks': True, 'can_delete_tasks': True},
        {'name': 'Developer', 'can_manage_board': False, 'can_manage_members': False, 'can_create_tasks': True,
         'can_edit_tasks': True, 'can_delete_tasks': False},
        {'name': 'Reporter', 'can_manage_board': False, 'can_manage_members': False, 'can_create_tasks': True,
         'can_edit_tasks': False, 'can_delete_tasks': False},
        {'name': 'Viewer', 'can_manage_board': False, 'can_manage_members': False, 'can_create_tasks': False,
         'can_edit_tasks': False, 'can_delete_tasks': False},
    ]

    created_roles = {}
    for data in roles_data:
        role = BoardRole.objects.create(board=board, **data)
        created_roles[role.name] = role

    BoardMembership.objects.create(
        user=board.owner,
        board=board,
        role=created_roles['Administrator']
    )

    statuses = [
        {'name': 'To Do', 'order': 1},
        {'name': 'In Progress', 'order': 2},
        {'name': 'Done', 'order': 3},
    ]
    for status_data in statuses:
        TaskStatus.objects.create(board=board, **status_data)

    priorities = [
        {'name': 'Critical', 'level': 4, 'color_hex': '#FF0000'},
        {'name': 'High', 'level': 3, 'color_hex': '#FFA500'},
        {'name': 'Medium', 'level': 2, 'color_hex': '#FFFF00'},
        {'name': 'Low', 'level': 1, 'color_hex': '#00FF00'},
    ]
    for priority_data in priorities:
        TaskPriority.objects.create(board=board, **priority_data)

    types = [
        {'name': 'Bug', 'icon_name': 'bug-icon'},
        {'name': 'Task', 'icon_name': 'task-icon'},
        {'name': 'Story', 'icon_name': 'story-icon'},
        {'name': 'Epic', 'icon_name': 'epic-icon'},
    ]
    for type_data in types:
        TaskType.objects.create(board=board, **type_data)

    Sprint.objects.create(board=board, name="Sprint 1")