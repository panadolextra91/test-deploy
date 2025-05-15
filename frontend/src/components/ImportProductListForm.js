import React, { useState } from "react";
import { Modal, Form, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const ImportProductListForm = ({ visible, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleOk = async () => {
    try {
      await form.validateFields();
      const file = fileList[0];
      console.log("fileList[0]", file);
      const realFile = file?.originFileObj || file;
      if (!realFile) return message.error("Please select a CSV file");
      const formData = new FormData();
      formData.append("file", realFile);
      setUploading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/products/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success(`Imported ${res.data.imported} products!`);
      setFileList([]);
      form.resetFields();
      setUploading(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setUploading(false);
      message.error(
        err.response?.data?.error || "Failed to import product list"
      );
    }
  };

  const uploadProps = {
    accept: ".csv",
    beforeUpload: (file) => {
      setFileList([file]);
      return false; // prevent auto-upload
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
    maxCount: 1,
  };

  return (
    <Modal
      title="Import Product List"
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={uploading}
      okText="Import"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="CSV File"
          name="csv"
          rules={[{ required: true, message: "Please select a CSV file" }]}
        >
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select CSV File</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImportProductListForm;
