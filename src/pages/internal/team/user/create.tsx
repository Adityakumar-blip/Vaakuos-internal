import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StatusSwitch } from '@/components/ui/status-switch';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
    useAddUserMutation,
    useUpdateUserMutation,
    useGetUserByIdQuery
} from '@/store/api/userApi';
import { useGetRolesQuery } from '@/store/api/roleApi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema builder to handle conditional password logic
const getUserSchema = (isEditMode: boolean) => z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: isEditMode
        ? z.string().optional()
        : z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    is_active: z.boolean().default(true),
    role: z.string().min(1, 'Role is required'),
});

type UserFormValues = z.infer<ReturnType<typeof getUserSchema>>;

export default function OwnerCreateUserPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // 'edit' | 'view' | null (add)

    const isViewMode = action === 'view';
    const isEditMode = action === 'edit';
    const isAddMode = !id;

    // Fetch user details if in edit/view mode
    const { data: user, isLoading: isUserLoading } = useGetUserByIdQuery(id as string, {
        skip: !id,
    });

    // Fetch available roles (all, for dropdown)
    const { data: rolesResult } = useGetRolesQuery({ page: 1, perPage: 100 });
    const roles = rolesResult?.data ?? [];

    const [addUser] = useAddUserMutation();
    const [updateUser] = useUpdateUserMutation();

    // Memoize schema so it doesn't recreate on every render (though overhead is low)
    const schema = useMemo(() => getUserSchema(Boolean(isEditMode)), [isEditMode]);

    const {
        register,
        handleSubmit: handleFormSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UserFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            phone: '',
            is_active: true,
            role: '',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                fullName: user.name,
                email: user.email,
                password: '', // Don't fill password
                phone: user.phone_number || '',
                is_active: user.is_active,
                role: user.user_roles?.[0]?.roles?.id || '',
            });
        }
    }, [user, reset]);

    const handleSubmit = async (data: UserFormValues) => {
        try {
            const userData = {
                name: data.fullName,
                email: data.email,
                roleId: data.role,
                is_active: data.is_active,
                phone_number: data.phone,
                ...(data.password ? { password: data.password } : {}),
            };

            if (isAddMode) {
                await addUser(userData).unwrap();
                toast.success('User created successfully');
            } else if (isEditMode && id) {
                await updateUser({ id, data: userData }).unwrap();
                toast.success('User updated successfully');
            }
            navigate('/team/user');
        } catch (error) {
            console.error(error);
            // Error toast is handled by api middleware
        }
    };


    const getTitle = () => {
        if (isViewMode) return 'User Details';
        if (isEditMode) return 'Edit User';
        return 'Add New User';
    };

    return (
        <div className="p-6 space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/team/user')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">{getTitle()}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/team/user')}>
                        {isViewMode ? 'Back' : 'Cancel'}
                    </Button>

                    {!isViewMode && (
                        <Button onClick={handleFormSubmit(handleSubmit)} disabled={isSubmitting}>
                            {isEditMode ? 'Update User' : 'Create User'}
                        </Button>
                    )}

                    {isViewMode && id && (
                        <Button onClick={() => navigate(`/team/user/create?id=${id}&action=edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-4 max-w-2xl">
                    <div className="space-y-2">
                        <Label htmlFor="user-name">Full Name<span className="text-red-500">*</span></Label>
                        <Input
                            id="user-name"
                            placeholder="John Doe"
                            {...register('fullName')}
                            disabled={isViewMode}
                        />
                        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user-email">Email<span className="text-red-500">*</span></Label>
                        <Input
                            id="user-email"
                            type="email"
                            placeholder="john@example.com"
                            {...register('email')}
                            disabled={isViewMode}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    {!isViewMode && (
                        <div className="space-y-2">
                            <Label htmlFor="user-password">Password{isAddMode && <span className="text-red-500">*</span>}</Label>
                            <Input
                                id="user-password"
                                type="password"
                                placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"}
                                {...register('password')}
                            />
                            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="user-role">Role<span className="text-red-500">*</span></Label>
                        <Controller
                            control={control}
                            name="role"
                            render={({ field }) => (
                                <Select
                                    disabled={isViewMode}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger id="user-role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user-phone">Phone</Label>
                        <Input
                            id="user-phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            {...register('phone')}
                            disabled={isViewMode}
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="pt-2">
                        <Controller
                            control={control}
                            name="is_active"
                            render={({ field }) => (
                                <StatusSwitch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    label="Active Status"
                                    description="Enable or disable this user account"
                                    disabled={isViewMode}
                                />
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
