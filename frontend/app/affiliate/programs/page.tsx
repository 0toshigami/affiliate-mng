"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { AffiliateProgram, ProgramEnrollment, EnrollmentStatus } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AffiliateProgramsPage() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [programsData, enrollmentsData] = await Promise.all([
        apiClient.listPrograms(),
        apiClient.getMyEnrollments(),
      ]);
      setPrograms(programsData);
      setEnrollments(enrollmentsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (programId: string) => {
    setEnrollingId(programId);
    try {
      await apiClient.enrollInProgram(programId);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrollingId(null);
    }
  };

  const isEnrolled = (programId: string) => {
    return enrollments.some(
      (e) => e.program_id === programId && e.status === EnrollmentStatus.ACTIVE
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading programs...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Available Programs</h2>
        <p className="text-gray-600 mt-1">
          Enroll in programs to start earning commissions
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                No programs available at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => {
            const enrolled = isEnrolled(program.id);
            const isEnrolling = enrollingId === program.id;

            return (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{program.name}</CardTitle>
                    {enrolled && <Badge variant="success">Enrolled</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {program.description || "No description"}
                  </p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">
                        {program.program_type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium text-green-600">
                        {program.commission_config.value}%
                      </span>
                    </div>
                  </div>

                  {!enrolled ? (
                    <Button
                      onClick={() => handleEnroll(program.id)}
                      disabled={isEnrolling}
                      className="w-full"
                    >
                      {isEnrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  ) : (
                    <Button variant="ghost" className="w-full" disabled>
                      Already Enrolled
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
