"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, BookOpen, Calendar, LayoutDashboard } from "lucide-react";

interface CurriculumItem {
    _id: string;
    topic: string;
    status: boolean;
    date?: string;
}

interface Curriculum {
    _id: string;
    course_name: string;
    curriculum: CurriculumItem[];
    updatedAt: string;
}

export default function ViewCurriculum() {
    const [data, setData] = useState<Curriculum[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("mentorAccessToken")

        const fetchCurriculum = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/course/my-curriculums`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const json = await res.json();
                setData(Array.isArray(json) ? json : [json]);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCurriculum();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 font-medium">Loading your curriculum...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10">
            {/* Page Title Section */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Progress</h1>
                    <p className="text-slate-500 mt-1">Review your syllabus completion and course milestones.</p>
                </div>
                <div className="hidden md:block">
                    <Badge variant="secondary" className="px-4 py-1 text-sm font-semibold">
                        Mentor Portal
                    </Badge>
                </div>
            </div>

            {data.length > 0 ? (
                <div className="grid gap-8">
                    {data.map((course) => {
                        const completed = course.curriculum.filter((item) => item.status).length;
                        const total = course.curriculum.length;
                        const percentage = total > 0 ? (completed / total) * 100 : 0;

                        return (
                            <Card key={course._id} className="border-none shadow-lg ring-1 ring-slate-200">
                                <CardHeader className="bg-white rounded-t-xl border-b pb-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                                                <BookOpen size={14} />
                                                Active Curriculum
                                            </div>
                                            <CardTitle className="text-2xl font-bold text-slate-900">
                                                {course.course_name}
                                            </CardTitle>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl min-w-[240px] border border-slate-100">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-500 font-medium">Completion Rate</span>
                                                <span className="font-bold text-blue-700">{Math.round(percentage)}%</span>
                                            </div>
                                            <Progress value={percentage} className="h-2 bg-slate-200" />
                                            <p className="text-[10px] text-slate-400 mt-2 text-center uppercase font-bold tracking-tighter">
                                                {completed} OF {total} TOPICS FINISHED
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {course.curriculum.map((item) => (
                                            <div
                                                key={item._id}
                                                className={`group flex items-center justify-between p-5 transition-all hover:bg-slate-50/50 ${item.status ? 'bg-slate-50/30' : ''}`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="flex-shrink-0">
                                                        {item.status ? (
                                                            <div className="bg-green-100 p-1.5 rounded-full">
                                                                <CheckCircle2 className="text-green-600 w-5 h-5" />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-slate-200">
                                                                <Circle className="text-slate-400 w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`text-base font-semibold ${item.status ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                            {item.topic}
                                                        </p>
                                                        {item.date && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                                <Calendar size={12} />
                                                                <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Badge
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${item.status
                                                        ? "bg-green-500/10 text-green-600 border-none"
                                                        : "bg-slate-100 text-slate-400 border-none"
                                                        }`}
                                                >
                                                    {item.status ? "Verified" : "Upcoming"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
                    <LayoutDashboard size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-500 font-semibold text-lg">Your curriculum is currently empty.</p>
                    <p className="text-slate-400 text-sm">Please contact administration for course assignments.</p>
                </div>
            )}
        </div>
    );
}