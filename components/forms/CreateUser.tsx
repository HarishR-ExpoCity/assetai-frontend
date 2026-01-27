"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { formSchema, formValidation } from "@/lib/validation";
import CustomFormField from "../CustomFormField";
import { SubmitButton } from "../SubmitButton";

const LoginForm = () => {
    const [isLoading, setIsLoading] = useState(false);

    // 1. Define your form.
    const schema = formSchema('create-user');
    const form = useForm<z.infer<typeof formValidation>>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
        },
    });

    // 2. Define a submit handler.
    const onSubmit = async (values: z.infer<typeof formValidation>) => {
        setIsLoading(true);
        try {

        } catch (error) {
            console.log(error);
        }
        console.log(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
                <CustomFormField
                    control={form.control}
                    name='firstName'
                    label='First Name'
                    placeholder='Type here...'
                />
                <CustomFormField
                    control={form.control}
                    name='lastName'
                    label='Last Name'
                    placeholder='Type here...'
                />
                <CustomFormField
                    control={form.control}
                    name='email'
                    label='Email'
                    placeholder='Type here...'
                />
                <SubmitButton isLoading={isLoading}>
                    Create
                </SubmitButton>
            </form>
        </Form>
    );
};

export default LoginForm;