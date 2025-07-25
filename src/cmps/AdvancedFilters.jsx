export function advancedFilter(board, filters) {
  if (!board || !filters || filters.length === 0) return board;

  const filteredGroups = board.groups.map(function(group) {
    const filteredTasks = group.tasks.filter(function(task) {
      return doesTaskPassAllFilters(task, filters, board);
    });
    
    return {
      ...group,
      tasks: filteredTasks
    };
  }).filter(function(group) {
    return group.tasks.length > 0;
  });

  return {
    ...board,
    groups: filteredGroups
  };
}

function convertRelativeDateToActualDate(relativeValue) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (relativeValue) {
    case 'today':
      return today.toISOString().split('T')[0];
    
    case 'tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    
    case 'this_week':
      const startOfWeek = new Date(today);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      return startOfWeek.toISOString().split('T')[0];
    
    case 'last_week':
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const dayOfLastWeek = lastWeek.getDay();
      lastWeek.setDate(lastWeek.getDate() - dayOfLastWeek);
      return lastWeek.toISOString().split('T')[0];
    
    case 'next_week':
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dayOfNextWeek = nextWeek.getDay();
      nextWeek.setDate(nextWeek.getDate() - dayOfNextWeek);
      return nextWeek.toISOString().split('T')[0];
    
    case 'this_month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return startOfMonth.toISOString().split('T')[0];
    
    case 'last_month':
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return lastMonth.toISOString().split('T')[0];
    
    case 'next_month':
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return nextMonth.toISOString().split('T')[0];
    
    case 'past_date':
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 1);
      return pastDate.toISOString().split('T')[0];
    
    case 'future_date':
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 1);
      return futureDate.toISOString().split('T')[0];
    
    default:
      return relativeValue
  }
}

function doesTaskPassAllFilters(task, filters, board) {
  return filters.every(function(filter) {
    return matchesFilter(task, filter, board);
  });
}

const FIELD_FILTERS = {
  group: (task, condition, value, startDate, endDate, board) => matchesGroupFilter(task, condition, value, board),
  name: (task, condition, value, startDate, endDate, board) => matchesNameFilter(task, condition, value),
  person: (task, condition, value, startDate, endDate, board) => matchesPersonOrPeopleFilter(task, condition, value, board),
  people: (task, condition, value, startDate, endDate, board) => matchesPersonOrPeopleFilter(task, condition, value, board),
  status: (task, condition, value, startDate, endDate, board) => matchesStatusFilter(task, condition, value),
  priority: (task, condition, value, startDate, endDate, board) => matchesPriorityFilter(task, condition, value),
  files: (task, condition, value, startDate, endDate, board) => matchesFilesFilter(task, condition),
  timeline: matchesTimelineFilter,
  date: (task, condition, value, startDate, endDate, board) => matchesDateFilter(task, condition, value),
};

function matchesFilter(task, filter, board) {
  const fn = FIELD_FILTERS[filter.field];
  if (!fn) {
    console.log('No filter function found for field:', filter.field);
    return true;
  }
  return fn(task, filter.condition, filter.value, filter.startDate, filter.endDate, board);
}

function matchesGroupFilter(task, condition, value, board) {
  const group = board.groups.find(function(g) {
    return g.tasks.some(function(t) {
      return t.id === task.id;
    });
  });
  if (!group) return false;

  switch (condition) {
    case 'is':
      return group.id === value;
    case 'is_not':
      return group.id !== value;
    default:
      return true;
  }
}

function matchesNameFilter(task, condition, value) {
  const taskTitle = task.title || '';

  switch (condition) {
    case 'is':
      return taskTitle === value;
    case 'is_not':
      return taskTitle !== value;
    default:
      return true;
  }
}

function matchesPersonOrPeopleFilter(task, condition, value, board) {
  const assigneeId = task.assignee;
  const membersArr = Array.isArray(task.members) ? task.members : [];
  const memberIds = membersArr.map(m => (typeof m === 'string' ? m : m._id));
  const hasAssignee = !!assigneeId;
  const hasMember = memberIds.includes(value);
  switch (condition) {
    case 'is':
      return assigneeId === value || hasMember;
    case 'is_not':
      return assigneeId !== value && !hasMember;
    case 'is_assigned':
      return hasAssignee || membersArr.length > 0;
    case 'is_not_assigned':
      return !hasAssignee && membersArr.length === 0;
    default:
      return true;
  }
}

function matchesStatusFilter(task, condition, value) {
  const taskStatus = task.status || '';

  switch (condition) {
    case 'is':
      return taskStatus === value;
    case 'is_not':
      return taskStatus !== value;
    case 'is_empty':
      return !taskStatus;
    case 'is_not_empty':
      return !!taskStatus;
    default:
      return true;
  }
}

function matchesPriorityFilter(task, condition, value) {
  const taskPriority = task.priority || '';

  switch (condition) {
    case 'is':
      return taskPriority === value;
    case 'is_not':
      return taskPriority !== value;
    case 'is_empty':
      return !taskPriority;
    case 'is_not_empty':
      return !!taskPriority;
    default:
      return true;
  }
}

function matchesFilesFilter(task, condition) {
  const hasFiles = task.files && task.files.length > 0;

  switch (condition) {
    case 'is_empty':
      return !hasFiles;
    case 'is_not_empty':
      return hasFiles;
    default:
      return true;
  }
}

function matchesTimelineFilter(task, condition, value, startDate, endDate, board) {
  const taskStartDate = task.timeline?.startDate || '';
  const taskEndDate = task.timeline?.endDate || '';
  
  // All timeline conditions use the value field (relative dates)
  if (!value) return true;
  
  const actualValue = convertRelativeDateToActualDate(value);
  
  switch (condition) {
    case 'is':
      return taskStartDate === actualValue || taskEndDate === actualValue;
    case 'is_not':
      return taskStartDate !== actualValue && taskEndDate !== actualValue;
    case 'is_empty':
      return !taskStartDate && !taskEndDate;
    case 'is_not_empty':
      return !!taskStartDate || !!taskEndDate;
    case 'starts_on':
      return taskStartDate === actualValue;
    case 'starts_after':
      return taskStartDate > actualValue;
    case 'starts_on_or_after':
      return taskStartDate >= actualValue;
    case 'starts_before':
      return taskStartDate < actualValue;
    case 'ends_on':
      return taskEndDate === actualValue;
    case 'ends_after':
      return taskEndDate > actualValue;
    case 'ends_on_or_after':
      return taskEndDate >= actualValue;
    case 'ends_before':
      return taskEndDate < actualValue;
    case 'ends_on_or_before':
      return taskEndDate <= actualValue;
    case 'is_before':
      return taskStartDate < actualValue;
    case 'is_after':
      return taskStartDate > actualValue;
    case 'is_on_or_before':
      return taskStartDate <= actualValue;
    case 'is_on_or_after':
      return taskStartDate >= actualValue;
    default:
      return true;
  }
}

function matchesDateFilter(task, condition, value) {
  const taskDate = task.dueDate || '';
  const actualValue = convertRelativeDateToActualDate(value);

  switch (condition) {
    case 'is':
      return taskDate === actualValue;
    case 'is_not':
      return taskDate !== actualValue;
    case 'is_empty':
      return !taskDate;
    case 'is_not_empty':
      return !!taskDate;
    case 'is_before':
      return taskDate < actualValue;
    case 'is_after':
      return taskDate > actualValue;
    case 'is_on_or_before':
      return taskDate <= actualValue;
    case 'is_on_or_after':
      return taskDate >= actualValue;
    default:
      return true;
  }
}