import axios from "../../config/axiosConfig";
import { useState } from "react";
import { Container } from "react-bootstrap";
import "../../style/DashBoard.scss";
import { useForm } from "react-hook-form";
import React from "react";
import {
  getUserToken,
  setTasks,
  getTasks,
  getSettings,
} from "../../datastore/userDataStore";
import { emitter } from "../../service/event";
import DeleteTaskModal from "./DeleteTaskModal";
import Log from "../../lib/log";
import CreateNewTask from "./CreateNewTask";
import EditTaskModal from "./EditTaskModal";
import DisplayTasks from "./DisplayTasks";

export type TaskContents = {
  task_id: number;
  task_name: string;
  task_describe: string | null;
  task_deadline: string | null;
  task_is_completed: number;
};

var deleteTaskIdChache = 0;
var updateTaskIdChache = 0;

export default function DashBoard() {
  const { resetField } = useForm();
  const [task, setDisplayTask] = useState<Array<TaskContents>>([]);
  const [isShowLoadingPane, setLoadingPaneShow] = useState(true);
  // modal
  const [showEditModal, setEditModalShow] = useState(false);
  const [showDeleteModal, setDeleteModalShow] = useState(false);
  const handleEditModalClose = () => setEditModalShow(false);
  const handleEditModalShow = (event: React.MouseEvent) => {
    updateTaskIdChache = Number(
      event.currentTarget.getAttribute("data-task-id")
    );
    setEditModalShow(true);
  };
  const handleDeleteModalShow = (event: React.MouseEvent) => {
    deleteTaskIdChache = Number(
      event.currentTarget.getAttribute("data-task-id")
    );
    if (getSettings().isDeleteModalShow === false) {
      handleDeleteTask();
      return;
    }
    setDeleteModalShow(true);
  };
  // error msg
  const [taskErrorMsg, setTaskErrorMsg] = useState("");

  // methods
  const getAllTasks = () => {
    Log.v("get all tasks");
    axios
      .get("/tasks", { headers: { token: getUserToken() } })
      .then((result: any) => {
        Log.v("receive task");
        Log.v(result);
        setDisplayTask(result.data.task);
        setTasks(result.data.task);
        setLoadingPaneShow(false);
      });
  };

  // create task
  // TODO any修正する
  const handleCreateNewTask = (data: any) => {
    if (data.newTask.length === 0) {
      setTaskErrorMsg("1文字以上入力してください");
      return;
    }

    if (data.newTask.length >= 50) {
      setTaskErrorMsg("50文字以上は登録できません");
      return;
    }
    setTaskErrorMsg("");
    Log.v("add one task");
    const tempTask = task;
    tempTask.push({
      task_id: 0,
      task_name: data.newTask,
      task_describe: null,
      task_deadline: null,
      task_is_completed: 0,
    });
    setDisplayTask(tempTask);
    Log.v("長さ :" + task.length);
    Log.v(task);
    createNewTask(data.newTask);
    resetField("newTask");
  };

  const createNewTask = (taskName: string) => {
    axios
      .post(
        "/tasks",
        {
          taskName: taskName,
          describe: null,
          deadline: null,
          isCompleted: 0,
        },
        { headers: { token: getUserToken() } }
      )
      .then(() => {
        getAllTasks();
      });
  };

  // delete task
  const deleteTask = (taskId: number) => {
    Log.v("delete task id :" + taskId);
    axios
      .delete(`/tasks/${taskId}`, { headers: { token: getUserToken() } })
      .then(() => {
        getAllTasks();
      });
  };

  const handleDeleteTask = () => {
    // modal close
    setDeleteModalShow(false);
    Log.v("delete task");
    if (deleteTaskIdChache == null) {
      return;
    }
    // 消すtaskを見かけ状削除されたように見せる
    const resultIndex = task.findIndex((obj) => {
      return obj.task_id === deleteTaskIdChache;
    });
    if (resultIndex == null) {
      return;
    }
    task.splice(resultIndex, 1);
    setDisplayTask(task);
    deleteTask(deleteTaskIdChache);
  };

  // update task
  const updateTask = (data: any) => {
    Log.v("task_name :" + data.taskName);
    Log.v("describe :" + data.describe);
    Log.v("desdline :" + data.deadline);
    if (data.taskName.length === 0) {
      return;
    }

    const localTasks = getTasks();
    const resultIndex = localTasks.findIndex((obj) => {
      return obj.task_id === deleteTaskIdChache;
    });
    if (resultIndex == null) {
      return;
    }
    localTasks.splice(resultIndex, 1, {
      task_id: 0,
      task_name: data.taskName,
      task_describe: data.describe,
      task_deadline: data.deadline,
      task_is_completed: 0,
    });
    Log.v(localTasks);
    setDisplayTask(localTasks);
    Log.v(localTasks);
    axios
      .patch(
        `/tasks/${updateTaskIdChache}`,
        {
          taskName: data.taskName,
          describe: data.describe.length === 0 ? null : data.describe,
          deadline: data.deadline.length === 0 ? null : data.deadline,
          isCompleted: 0,
        },
        { headers: { token: getUserToken() } }
      )
      .then(() => {
        getAllTasks();
      });
  };

  // 初回のみログイン情報読み込み
  emitter.once("signin-ok", () => {
    getAllTasks();
    emitter.off("signin-ok", () => {});
  });

  return (
    <div id="dashboard">
      <Container className="dashboard-container">
        <CreateNewTask
          handleCreateNewTask={handleCreateNewTask}
          createTaskErrorMsg={taskErrorMsg}
        />
        <DisplayTasks
          isLoadingVisible={isShowLoadingPane}
          tasks={task}
          handleEditModalShow={handleEditModalShow}
          handleDeleteModalShow={handleDeleteModalShow}
        />
      </Container>
      <EditTaskModal
        isEditModalVisible={showEditModal}
        handleEditModalClose={handleEditModalClose}
        updateTask={updateTask}
      />
      <DeleteTaskModal
        isDeleteModalVisible={showDeleteModal}
        setDeleteModalVisible={setDeleteModalShow}
        handleDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
