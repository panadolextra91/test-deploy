import React, { useState } from "react";
import { Modal, Form, InputNumber, Button, List, message } from "antd";
import axios from "axios";

const MakePurchaseOrder = ({ visible, onCancel, products }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Initialize quantities for each product
  const initialQuantities = {};
  (products || []).forEach((prod) => {
    initialQuantities[prod.key] = 1;
  });

  const [quantities, setQuantities] = useState(initialQuantities);

  React.useEffect(() => {
    // Reset quantities when products change
    const newQuantities = {};
    (products || []).forEach((prod) => {
      newQuantities[prod.key] = 1;
    });
    setQuantities(newQuantities);
  }, [products, visible]);

  const handleQuantityChange = (id, value) => {
    setQuantities((q) => ({ ...q, [id]: value }));
  };

  const handleOk = async () => {
    if (!products || products.length === 0) return;
    setLoading(true);
    const token = sessionStorage.getItem("token");
    try {
      let response;
      if (products.length === 1) {
        // Single product order
        const prod = products[0];
        response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/products/${prod.key}/email-order`,
          { quantity: quantities[prod.key] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Bulk order
        const items = products.map((prod) => ({
          id: prod.key,
          quantity: quantities[prod.key] || 1,
        }));
        response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/products/email`,
          { items },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      // Compose the message from response
      let supplierEmails = "";
      let userEmail = "";
      if (response?.data) {
        if (response.data.emailedTo) {
          supplierEmails = Array.isArray(response.data.emailedTo) ? response.data.emailedTo.join(", ") : response.data.emailedTo;
        }
        if (response.data.cc) {
          userEmail = response.data.cc;
        }
      }
      // If userEmail is still missing, fetch from /api/users/profile
      if (!userEmail) {
        try {
          const token = sessionStorage.getItem('token');
          const userRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.data && userRes.data.email) {
            userEmail = userRes.data.email;
            sessionStorage.setItem('userEmail', userEmail);
          }
        } catch {}
      }
      message.success(
        `Purchase order sent successfully to ${supplierEmails}${userEmail ? ", and cc to " + userEmail : ""}`
      );
      setLoading(false);
      onCancel();
    } catch (err) {
      setLoading(false);
      message.error(
        err.response?.data?.error || "Failed to send purchase order"
      );
    }
  };

  return (
    <Modal
      title="Make Purchase Order"
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Send Order"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <List
          dataSource={products}
          renderItem={(prod) => (
            <List.Item>
              <span>
                <b>{prod.brand} {prod.name}</b> (Supplier: {prod.supplier})
              </span>
              <Form.Item
                style={{ margin: 0, marginLeft: 16 }}
                label="Quantity"
                colon={false}
              >
                <InputNumber
                  min={1}
                  value={quantities[prod.key]}
                  onChange={(value) => handleQuantityChange(prod.key, value)}
                />
              </Form.Item>
            </List.Item>
          )}
        />
      </Form>
    </Modal>
  );
};

export default MakePurchaseOrder;
