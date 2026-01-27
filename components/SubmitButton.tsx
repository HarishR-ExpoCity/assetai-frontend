import React from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
    isLoading: boolean,
    className?: string,
    children: React.ReactNode,
}

export const SubmitButton = ({ isLoading, className, children }: ButtonProps) => {
    return (
        <Button type="submit" disabled={isLoading} className={className ?? 'shadow-primary-btn w-full'}>
            {
                isLoading ? (
                    <div className='flex items-center'>
                        <Loader2 size={20} className='animate-spin' /> &nbsp;
                        Loading...
                    </div>
                ) : children
            }
        </Button>
    );
};
