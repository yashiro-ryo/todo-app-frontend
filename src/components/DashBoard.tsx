import axios from "../config/axiosConfig";
import { useEffect, useState } from "react";
import {
  Card,
  Container,
  Form,
  Button,
  ListGroup,
  ListGroupItem,
  Modal,
} from "react-bootstrap";
import "../style/DashBoard.scss";
import { useForm } from "react-hook-form";
import React from "react";
import {
  getUserToken,
  getUserId,
  setTasks,
  getTasks,
  addOneTask,
  getSettings,
} from "../datastore/userDataStore";
import { emitter } from "../service/event";
import LoadingPane from "./LoadingPane";

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
  const { register, handleSubmit, resetField } = useForm();
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
  const handleDeleteModalClose = () => setDeleteModalShow(false);
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
    console.log("get all tasks");
    axios
      .get("/tasks", { headers: { token: getUserToken() } })
      .then((result: any) => {
        console.log("receive task");
        console.log(result);
        setDisplayTask(result.data.task);
        setTasks(result.data.task);
        setLoadingPaneShow(false);
      });
  };

  // create task
  // TODO any????????????
  const handleCreateNewTask = (data: any) => {
    if (data.newTask.length === 0) {
      setTaskErrorMsg("1????????????????????????????????????");
      return;
    }

    if (data.newTask.length >= 50) {
      setTaskErrorMsg("50????????????????????????????????????");
      return;
    }
    setTaskErrorMsg("");
    console.log("add one task");
    const tempTask = task;
    tempTask.push({
      task_id: 0,
      task_name: data.newTask,
      task_describe: null,
      task_deadline: null,
      task_is_completed: 0,
    });
    setDisplayTask(tempTask);
    console.log("?????? :" + task.length);
    console.log(task);
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
    console.log("delete task id :" + taskId);
    axios
      .delete(`/tasks/${taskId}`, { headers: { token: getUserToken() } })
      .then(() => {
        getAllTasks();
      });
  };

  const handleDeleteTask = () => {
    // modal close
    setDeleteModalShow(false);
    console.log("delete task");
    if (deleteTaskIdChache == null) {
      return;
    }
    // ??????task????????????????????????????????????????????????
    const resultIndex = task.findIndex((obj) => {
      return obj.task_id == deleteTaskIdChache;
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
    console.log("task_name :" + data.taskName);
    console.log("describe :" + data.describe);
    console.log("desdline :" + data.deadline);
    if (data.taskName.length === 0) {
      return;
    }

    const localTasks = getTasks();
    const resultIndex = localTasks.findIndex((obj) => {
      return obj.task_id == deleteTaskIdChache;
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
    console.log(localTasks);
    setDisplayTask(localTasks);
    console.log(localTasks);
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

  // ??????????????????????????????????????????
  emitter.once("signin-ok", () => {
    getAllTasks();
    emitter.off("signin-ok", () => {});
  });

  const displayTaskInline = (taskArray: Array<TaskContents>) => {
    if (taskArray.length === 0) {
      return <div className="task-empty-view">???????????????????????????</div>;
    }
    return (
      <ListGroup>
        {taskArray.map((value, index) => {
          return (
            <ListGroupItem key={index}>
              <p>{value.task_name}</p>
              <Button
                className="btn btn-secondary"
                onClick={handleEditModalShow}
                data-task-id={value.task_id}
              >
                ??????
              </Button>
              <Button
                className="btn btn-danger"
                onClick={handleDeleteModalShow}
                data-task-id={value.task_id}
              >
                ??????
              </Button>
            </ListGroupItem>
          );
        })}
      </ListGroup>
    );
  };

  const editTaskModal = () => {
    return (
      <Modal show={showEditModal} onHide={handleEditModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>???????????????</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(updateTask)}>
            <Form.Label>????????????</Form.Label>
            <Form.Control
              type="text"
              placeholder="????????????"
              {...register("taskName")}
            />
            <Form.Label>??????</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="??????"
              {...register("describe")}
            />
            <Form.Label>?????? (??????: yyyy/mm/dd hh:mm:ss)</Form.Label>
            <Form.Control
              type="text"
              placeholder="yyyy/mm/dd hh:mm:ss"
              {...register("deadline")}
            />
            <div className="btn-set">
              <Button
                className="cancel-btn"
                variant="secondary"
                onClick={handleEditModalClose}
              >
                ???????????????
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="submit-btn"
                onClick={handleEditModalClose}
              >
                ??????
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };

  const deleteTaskModal = () => {
    return (
      <Modal show={showDeleteModal} onHide={handleDeleteModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>??????</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>?????????????????????????????????????????? ????????????????????????????????????.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteModalClose}>
            ???????????????
          </Button>
          <Button variant="danger" onClick={handleDeleteTask}>
            ??????
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div id="dashboard">
      <Container className="dashboard-container">
        <Card className="card create-task">
          <Card.Header>???????????????</Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit(handleCreateNewTask)}>
              <Form.Label>????????????</Form.Label>
              <Form.Control
                type="text"
                placeholder="????????????"
                {...register("newTask")}
              />
              <p style={{ color: "#f00", fontWeight: "bold" }}>
                {taskErrorMsg}
              </p>
              <Button type="submit" className="btn btn-primary">
                ??????
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <Card className="card uncomplete-task">
          <Card.Header>?????????</Card.Header>
          <Card.Body>
            {isShowLoadingPane ? (
              LoadingPane()
            ) : (
              <ListGroup>{displayTaskInline(task)}</ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
      {editTaskModal()}
      {deleteTaskModal()}
    </div>
  );
}
