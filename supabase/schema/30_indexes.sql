-- 30_indexes.sql
-- Indexes covering every list view the frontend selects by.
-- Run AFTER 20_business_tables.sql.

create index if not exists idx_workspace_owner        on ms_workspace(owner_id);
create index if not exists idx_workspace_active_owner on ms_workspace(is_active, owner_id);

create index if not exists idx_project_workspace      on ms_project(workspace_id);
create index if not exists idx_project_active_ws      on ms_project(is_active, workspace_id);

create index if not exists idx_task_project           on ms_task(project_id);
create index if not exists idx_task_active_project    on ms_task(is_active, project_id);
create index if not exists idx_task_assignee          on ms_task(assignee_id);
create index if not exists idx_task_status            on ms_task(status);

create index if not exists idx_taskstep_task_position on tr_task_step(task_id, position);
create index if not exists idx_taskstep_active_task   on tr_task_step(is_active, task_id);

create index if not exists idx_comment_task           on tr_comment(task_id);
create index if not exists idx_comment_active_task    on tr_comment(is_active, task_id);
create index if not exists idx_comment_user           on tr_comment(user_id);
