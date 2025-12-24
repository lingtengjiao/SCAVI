import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ProductType } from "../../components/Products";
import { Category } from "../../types/admin";

interface DashboardPageProps {
  products: ProductType[];
  categories: Category[];
}

export function DashboardPage({ products, categories }: DashboardPageProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{products.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Active Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{categories.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12</div>
        </CardContent>
      </Card>
    </div>
  );
}

