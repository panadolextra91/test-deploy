import React, { useState } from "react";
import { Form, Input, Button, message, Card } from "antd";
import axios from "axios";
import { MailOutlined } from "@ant-design/icons";
import "./ForgotPassword.css";

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async (values) => {
        const { email } = values;
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/forgot-password`, { email });
            message.success("A new password has been sent to your email.");
        } catch (error) {
            console.error("Error in forgot password:", error);
            message.error(error.response?.data?.error || "Failed to send password reset email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <Card className="forgot-password-card">
                <h2>Forgot Password</h2>
                <p>Enter your email to reset your password</p>
                <Form
                    layout="vertical"
                    onFinish={handleForgotPassword}
                    className="forgot-password-form"
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Please enter your email!" },
                            { type: "email", message: "Please enter a valid email address!" },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ForgotPassword;
