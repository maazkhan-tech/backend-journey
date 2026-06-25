export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export interface CreateTaskInput {
  title: string;
}

export interface UpdateTaskInput {
  title?: string;
  done?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
}
