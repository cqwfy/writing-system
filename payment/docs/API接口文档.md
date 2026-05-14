# 中学学生管理系统 — API 接口文档

## 1. 概述

### 1.1 基本信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `/api/v1` |
| 认证方式 | Bearer Token (JWT) |
| 请求格式 | JSON / multipart/form-data (文件上传) |
| 响应格式 | JSON |
| 超时时间 | 30s |
| 字符编码 | UTF-8 |

### 1.2 通用响应结构

```json
{
  "data": { ... },
  "message": "操作成功",
  "code": 200
}
```

**分页响应**：
```json
{
  "data": {
    "list": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**错误响应**：
```json
{
  "error": "错误描述信息",
  "code": "ERROR_CODE"
}
```

### 1.3 HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 / 业务逻辑错误 |
| 401 | 未认证或 Token 过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如唯一约束） |
| 500 | 服务器内部错误 |

### 1.4 认证说明

- Web 后台：`POST /auth/login` 获取 tokens
- 微信小程序：`POST /auth/wechat-login` 获取 tokens
- 后续请求在 Header 中携带：`Authorization: Bearer <accessToken>`
- accessToken 过期（2h）后，用 `POST /auth/refresh` 获取新 token

---

## 2. 认证模块 (`/auth`)

### 2.1 用户名密码登录

```
POST /api/v1/auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**校验规则**: `username` 3-50 字符，`password` 6-100 字符

**响应** (200):
```json
{
  "data": {
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    },
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "name": "系统管理员",
      "phone": "138****1234"
    }
  }
}
```

**错误**:
- 400: "用户名或密码错误"
- 400: "账户已被禁用"

---

### 2.2 微信登录

```
POST /api/v1/auth/wechat-login
```

**请求体**:
```json
{
  "code": "081x7a0w3..."
}
```

**校验规则**: `code` 非空字符串

**响应 - 已绑定用户** (200):
```json
{
  "data": {
    "isNewUser": false,
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    },
    "user": {
      "id": 10,
      "role": "student",
      "name": "张三",
      "student": { "id": 1, "studentNo": "20260001" }
    }
  }
}
```

**响应 - 新用户** (200):
```json
{
  "data": {
    "isNewUser": true,
    "tempToken": "temp_xxx..."
  }
}
```

**错误**:
- 400: "invalid code" (微信 code 无效)
- 500: 微信服务调用失败

---

### 2.3 绑定账号

```
POST /api/v1/auth/bind
```

**请求体**:
```json
{
  "tempToken": "temp_xxx...",
  "bindType": "student_no",
  "bindValue": "20260001"
}
```

**校验规则**:
- `tempToken` 非空
- `bindType`: `"student_no"` 或 `"phone"`
- `bindValue` 非空

**响应** (200):
```json
{
  "data": {
    "tokens": { "accessToken": "...", "refreshToken": "..." },
    "user": { ... }
  }
}
```

**错误**:
- 400: "绑定失败，未找到匹配的学生/家长信息"
- 400: "无效的临时 Token"

---

### 2.4 刷新 Token

```
POST /api/v1/auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "eyJhbG..."
}
```

**响应** (200):
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**错误**:
- 401: "无效的 Refresh Token"

---

### 2.5 获取当前用户信息

```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**权限**: 所有已登录用户

**响应** (200):
```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "系统管理员",
    "phone": "138****1234",
    "student": null,
    "teacher": null,
    "parent": null
  }
}
```

> 根据角色不同，`student` / `teacher` / `parent` 字段会对应返回关联信息。

---

## 3. 学生管理 (`/students`)

### 3.1 获取学生列表

```
GET /api/v1/students
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20 |
| keyword | string | 否 | 搜索关键词（姓名/学号） |
| classId | number | 否 | 按班级筛选 |
| gradeLevel | string | 否 | 按年级筛选: "7"/"8"/"9" |
| status | string | 否 | 按状态筛选 |

**响应** (200):
```json
{
  "data": {
    "list": [
      {
        "id": 1,
        "studentNo": "20260001",
        "name": "张三",
        "gender": "male",
        "class": { "id": 1, "name": "七年级(1)班" },
        "status": "active",
        "phone": "138****1234"
      }
    ],
    "total": 500,
    "page": 1,
    "pageSize": 20,
    "totalPages": 25
  }
}
```

---

### 3.2 获取学生详情

```
GET /api/v1/students/:id
Authorization: Bearer <token>
```

**权限**: admin, teacher

**响应** (200): 包含完整的学生信息（含班级、宿舍关联）。

**错误**:
- 404: "学生不存在"

---

### 3.3 创建学生

```
POST /api/v1/students
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "studentNo": "20260011",
  "name": "新学生",
  "gender": "male",
  "classId": 1,
  "birthDate": "2010-09-01",
  "address": "北京市朝阳区",
  "phone": "13800138000"
}
```

**校验规则**:
- `studentNo`: 3-20 字符，必填
- `name`: 2-50 字符，必填
- `gender`: "male" / "female"，必填
- `classId`: 数字，必填
- `phone`: 11 位手机号，可选

**错误**:
- 400: 参数校验失败（Zod）
- 409: "学号已存在"

---

### 3.4 更新学生

```
PUT /api/v1/students/:id
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**: 同创建，所有字段可选

---

### 3.5 删除学生（软删除）

```
DELETE /api/v1/students/:id
Authorization: Bearer <token>
```

**权限**: admin, teacher

**响应** (200):
```json
{ "data": { "message": "删除成功" } }
```

> 软删除仅设置 `deletedAt`，数据不会物理删除。

---

### 3.6 Excel 批量导入

```
POST /api/v1/students/import
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**权限**: admin, teacher

**表单字段**:
- `file`: Excel 文件 (.xlsx)

**Excel 模板列**: 学号、姓名、性别、出生日期、班级、地址、籍贯、入学日期、手机号

**响应** (200):
```json
{
  "data": {
    "success": 48,
    "failed": 2,
    "errors": [
      { "row": 5, "studentNo": "20260001", "error": "学号已存在" }
    ]
  }
}
```

---

### 3.7 Excel 导出

```
GET /api/v1/students/export
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `classId`, `gradeLevel`, `status`

**响应**: 文件下载（application/vnd.openxmlformats-officedocument.spreadsheetml.sheet）

---

### 3.8 上传照片

```
POST /api/v1/students/:id/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**权限**: admin, teacher

**表单字段**:
- `photo`: 图片文件 (jpg/png, ≤10MB)

**响应** (200):
```json
{
  "data": {
    "photoUrl": "https://cos-bucket.cos.ap-guangzhou.myqcloud.com/avatars/xxx.webp"
  }
}
```

> 服务端自动转换 WebP 格式，生成 200x200 缩略图。

---

## 4. 教师管理 (`/teachers`)

### 4.1 获取教师列表

```
GET /api/v1/teachers
Authorization: Bearer <token>
```

**权限**: admin

**查询参数**: `page`, `pageSize`, `keyword`

### 4.2 获取所有教师（简要列表）

```
GET /api/v1/teachers/all
Authorization: Bearer <token>
```

**权限**: admin, teacher

**响应**: 返回所有教师的 id、name、teacherNo，用于下拉选择。

### 4.3 创建教师

```
POST /api/v1/teachers
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "teacherNo": "T2026001",
  "name": "李老师",
  "title": "高级教师",
  "subject": "数学",
  "phone": "13900139000",
  "password": "Teacher@123"
}
```

> 创建教师时自动创建 User 记录。

### 4.4 重置密码

```
POST /api/v1/teachers/:id/reset-password
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "password": "NewPassword@123"
}
```

---

## 5. 班级管理 (`/classes`)

### 5.1 获取班级列表

```
GET /api/v1/classes
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `page`, `pageSize`, `gradeLevel`, `academicYear`

### 5.2 获取所有班级

```
GET /api/v1/classes/all
Authorization: Bearer <token>
```

**权限**: admin, teacher

**响应**: 返回所有班级简要信息，用于下拉选择。

### 5.3 创建班级

```
POST /api/v1/classes
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "name": "七年级(3)班",
  "gradeLevel": "7",
  "academicYear": "2026-2027",
  "homeroomTeacherId": 2
}
```

**校验规则**:
- `name`: 2-50 字符
- `gradeLevel`: "7" / "8" / "9"
- `academicYear`: 格式如 "2026-2027"

### 5.4 设置班主任

```
PUT /api/v1/classes/:id/homeroom-teacher
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "teacherId": 2
}
```

### 5.5 获取班级学生

```
GET /api/v1/classes/:id/students
Authorization: Bearer <token>
```

**权限**: admin, teacher

### 5.6 学生转班

```
POST /api/v1/classes/transfer
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "studentId": 10,
  "targetClassId": 3
}
```

---

## 6. 课程管理 (`/courses`)

### 6.1 获取课程列表

```
GET /api/v1/courses
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `page`, `pageSize`, `gradeLevel`, `semester`

### 6.2 获取所有课程

```
GET /api/v1/courses/all
Authorization: Bearer <token>
```

### 6.3 创建课程

```
POST /api/v1/courses
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "name": "七年级数学",
  "code": "MATH7",
  "gradeLevel": "7",
  "teacherId": 2,
  "weeklyHours": 5,
  "semester": "first",
  "academicYear": "2026-2027"
}
```

---

## 7. 课表管理 (`/timetables`)

### 7.1 获取班级课表

```
GET /api/v1/timetables/class/:classId
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `semester`, `academicYear`

**响应**: 按 dayOfWeek + period 组织的课表矩阵。

### 7.2 批量设置课表

```
POST /api/v1/timetables/batch
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "classId": 1,
  "semester": "first",
  "academicYear": "2026-2027",
  "entries": [
    { "dayOfWeek": 1, "period": 1, "courseId": 1, "classroom": "101教室" },
    { "dayOfWeek": 1, "period": 2, "courseId": 2, "classroom": "101教室" }
  ]
}
```

---

## 8. 成绩管理 (`/grades`)

### 8.1 考试管理

#### 获取考试列表

```
GET /api/v1/grades/exams
Authorization: Bearer <token>
```

**权限**: admin, teacher

#### 创建考试

```
POST /api/v1/grades/exams
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "name": "月考",
  "semester": "first",
  "academicYear": "2026-2027",
  "examDate": "2026-10-15",
  "weight": 0.3,
  "month": 10
}
```

#### 删除考试

```
DELETE /api/v1/grades/exams/:id
Authorization: Bearer <token>
```

**权限**: admin, teacher

> 级联删除该考试下的所有成绩记录。

---

### 8.2 成绩录入

#### 获取成绩列表

```
GET /api/v1/grades
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `examId` (必填), `courseId`, `classId`

#### 批量录入成绩

```
POST /api/v1/grades/batch
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "examTypeId": 1,
  "courseId": 1,
  "grades": [
    { "studentId": 1, "score": 92.5 },
    { "studentId": 2, "score": 88.0 }
  ]
}
```

**校验规则**:
- `examTypeId`: 必填
- `courseId`: 必填
- `grades[].studentId`: 必填
- `grades[].score`: 0-1000 之间，1 位小数

---

### 8.3 成绩发布

```
POST /api/v1/grades/publish/:examId
Authorization: Bearer <token>
```

**权限**: admin, teacher

**处理逻辑**:
1. 计算每个学生的总分
2. 计算班级内排名 (classRank)
3. 计算年级排名 (gradeRank)
4. 设置 isPublished = true

**错误**:
- 400: "该考试暂无成绩数据"

---

### 8.4 成绩统计

```
GET /api/v1/grades/stats/:examId
Authorization: Bearer <token>
```

**权限**: admin, teacher

**响应**:
```json
{
  "data": {
    "examName": "期中考试",
    "totalStudents": 500,
    "courses": [
      {
        "courseId": 1,
        "courseName": "数学",
        "avgScore": 78.5,
        "maxScore": 100,
        "minScore": 45,
        "passRate": 0.85,
        "excellentRate": 0.30,
        "distribution": {
          "0-59": 10, "60-69": 30, "70-79": 80,
          "80-89": 120, "90-100": 60
        }
      }
    ]
  }
}
```

---

### 8.5 学生端查成绩

```
GET /api/v1/grades/my
Authorization: Bearer <token>
```

**权限**: student, parent (通过 token 自动获取 studentId)

**查询参数**: `examTypeId` (可选)

**响应**: 按考试分组返回该学生的所有已发布成绩。

---

## 9. 考勤管理 (`/attendance`)

### 9.1 考勤记录

#### 获取考勤列表

```
GET /api/v1/attendance
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `recordDate`, `classId`, `period`, `status`, `page`, `pageSize`

#### 批量标记考勤

```
POST /api/v1/attendance/batch
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "recordDate": "2026-05-13",
  "period": "morning",
  "records": [
    { "studentId": 1, "status": "present", "remark": "" },
    { "studentId": 2, "status": "absent", "remark": "未到校" },
    { "studentId": 3, "status": "late", "remark": "迟到15分钟" }
  ]
}
```

**校验规则**:
- `recordDate`: 必填，格式 YYYY-MM-DD
- `period`: "morning" / "afternoon" / "full_day"
- `records[].status`: "present" / "absent" / "late" / "early_leave" / "sick_leave" / "personal_leave"

---

#### 考勤统计

```
GET /api/v1/attendance/stats
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `startDate`, `endDate`, `classId`

---

### 9.2 请假管理

#### 学生端 - 我的考勤

```
GET /api/v1/attendance/my
Authorization: Bearer <token>
```

**权限**: student, parent

#### 提交请假申请

```
POST /api/v1/attendance/leave-requests
Authorization: Bearer <token>
```

**权限**: 所有角色

**请求体**:
```json
{
  "studentId": 1,
  "startDate": "2026-05-14",
  "endDate": "2026-05-15",
  "leaveType": "sick",
  "reason": "感冒发烧，需在家休息",
  "attachmentUrl": ""
}
```

> student/parent 角色不需要传 studentId，由 token 自动获取。

#### 获取请假申请列表

```
GET /api/v1/attendance/leave-requests
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `status`, `classId`

#### 审批请假

```
PUT /api/v1/attendance/leave-requests/:id/approve
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "status": "approved",
  "remark": "同意请假，注意休息"
}
```

> status: "approved" / "rejected"

#### 我的请假记录

```
GET /api/v1/attendance/leave-requests/my
Authorization: Bearer <token>
```

**权限**: student, parent

---

## 10. 费用管理 (`/fees`)

### 10.1 费用项目 CRUD

```
GET    /api/v1/fees/items          # 列表
POST   /api/v1/fees/items          # 创建 (admin)
```

**创建请求体**:
```json
{
  "name": "2026年秋季学杂费",
  "amount": 1500.00,
  "feeType": "miscellaneous",
  "gradeLevel": "7",
  "semester": "first",
  "academicYear": "2026-2027",
  "dueDate": "2026-11-01"
}
```

### 10.2 生成缴费记录

```
POST /api/v1/fees/items/:feeItemId/generate
Authorization: Bearer <token>
```

**权限**: admin

> 为该年级所有学生批量创建 payment 记录。

### 10.3 缴费查询

```
GET /api/v1/fees/payments
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `status`, `classId`, `feeItemId`, `page`, `pageSize`

### 10.4 学生端 - 我的缴费

```
GET /api/v1/fees/payments/my
Authorization: Bearer <token>
```

**权限**: student, parent

### 10.5 标记已缴费

```
POST /api/v1/fees/payments/:paymentId/paid
Authorization: Bearer <token>
```

**权限**: admin

**请求体**:
```json
{
  "paidAmount": 1500.00
}
```

---

## 11. 通知公告 (`/notices`)

### 11.1 通知列表

```
GET /api/v1/notices
Authorization: Bearer <token>
```

**权限**: 所有角色（按角色自动过滤可见范围）

**查询参数**: `category`, `page`, `pageSize`

### 11.2 通知详情

```
GET /api/v1/notices/:id
Authorization: Bearer <token>
```

### 11.3 创建通知

```
POST /api/v1/notices
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "title": "关于期中考试安排的通知",
  "content": "各位同学...",
  "category": "announcement",
  "targetType": "all",
  "targetId": null,
  "isPinned": true
}
```

**校验规则**:
- `title`: 1-200 字符
- `content`: 非空
- `category`: "notice" / "announcement" / "homework" / "event" / "communication"
- `targetType`: "all" / "grade" / "class" / "specific"

### 11.4 发布通知

```
POST /api/v1/notices/:id/publish
Authorization: Bearer <token>
```

**权限**: admin, teacher

### 11.5 编辑通知

```
PUT /api/v1/notices/:id
Authorization: Bearer <token>
```

**权限**: admin, teacher

### 11.6 删除通知

```
DELETE /api/v1/notices/:id
Authorization: Bearer <token>
```

**权限**: admin

---

## 12. 宿舍管理 (`/dormitories`)

### 12.1 宿舍楼管理

```
GET    /api/v1/dormitories/buildings    # 列表 (admin, teacher)
POST   /api/v1/dormitories/buildings    # 创建 (admin)
```

**创建请求体**:
```json
{
  "name": "男生宿舍楼A",
  "buildingType": "male",
  "floorCount": 6
}
```

### 12.2 宿舍房间管理

```
GET    /api/v1/dormitories/rooms       # 列表 (admin, teacher)
POST   /api/v1/dormitories/rooms       # 创建 (admin)
```

**创建请求体**:
```json
{
  "roomNumber": "101",
  "buildingId": 1,
  "capacity": 6
}
```

### 12.3 学生分配

```
PUT    /api/v1/dormitories/rooms/:roomId/assign        # 分配单个学生 (admin)
PUT    /api/v1/dormitories/rooms/:roomId/assign-batch  # 批量分配 (admin)
PUT    /api/v1/dormitories/rooms/:roomId/remove        # 移出学生 (admin)
```

**批量分配请求体**:
```json
{
  "studentIds": [1, 2, 3]
}
```

**移出请求体**:
```json
{
  "studentId": 1
}
```

**错误**:
- 404: "宿舍房间不存在"
- 400: "房间容量不足，剩余 X 个床位"
- 400: "学生 X 已在房间 Y 中"

### 12.4 学生端 - 我的宿舍

```
GET /api/v1/dormitories/my
Authorization: Bearer <token>
```

**权限**: student, parent

---

## 13. 奖惩记录 (`/rewards`)

### 13.1 奖惩列表

```
GET /api/v1/rewards
Authorization: Bearer <token>
```

**权限**: admin, teacher

**查询参数**: `type`, `studentId`, `page`, `pageSize`

### 13.2 学生端查询

```
GET /api/v1/rewards/student/:studentId
Authorization: Bearer <token>
```

**权限**: 所有角色（学生只能查自己的）

### 13.3 创建奖惩记录

```
POST /api/v1/rewards
Authorization: Bearer <token>
```

**权限**: admin, teacher

**请求体**:
```json
{
  "studentId": 1,
  "type": "reward",
  "category": "三好学生",
  "description": "2026年秋季学期表现优异，被评为三好学生",
  "recordDate": "2026-05-10"
}
```

**校验规则**:
- `studentId`: 必填，有效学生 ID
- `type`: "reward" / "punishment"
- `category`: 1-50 字符
- `description`: 非空

### 13.4 删除奖惩记录

```
DELETE /api/v1/rewards/:id
Authorization: Bearer <token>
```

**权限**: admin

---

## 14. 数据看板 (`/dashboard`)

### 14.1 获取统计数据

```
GET /api/v1/dashboard/stats
Authorization: Bearer <token>
```

**权限**: admin, teacher

**响应**:
```json
{
  "data": {
    "studentCount": 500,
    "teacherCount": 30,
    "classCount": 15,
    "todayAttendance": 0.95,
    "recentExams": [
      { "id": 1, "name": "期中考试", "examDate": "2026-05-01" }
    ],
    "recentGrades": [
      { "examId": 1, "avgScore": 78.5 }
    ],
    "gradeLevelStats": [
      {
        "gradeLevel": "7",
        "studentCount": 180,
        "avgScore": 80.2,
        "passRate": 0.88,
        "excellentRate": 0.32
      }
    ]
  }
}
```

---

## 15. 健康检查

```
GET /api/health
```

**响应** (200):
```json
{
  "status": "ok",
  "timestamp": "2026-05-13T08:00:00.000Z"
}
```

---

## 16. 接口索引

| 模块 | 接口数 | 基础路径 |
|------|--------|---------|
| 认证 | 5 | `/api/v1/auth` |
| 学生 | 8 | `/api/v1/students` |
| 教师 | 6 | `/api/v1/teachers` |
| 班级 | 8 | `/api/v1/classes` |
| 课程 | 5 | `/api/v1/courses` |
| 课表 | 4 | `/api/v1/timetables` |
| 成绩 | 6 | `/api/v1/grades` |
| 考勤 | 8 | `/api/v1/attendance` |
| 费用 | 6 | `/api/v1/fees` |
| 通知 | 6 | `/api/v1/notices` |
| 宿舍 | 8 | `/api/v1/dormitories` |
| 奖惩 | 4 | `/api/v1/rewards` |
| 看板 | 1 | `/api/v1/dashboard` |
| 健康检查 | 1 | `/api/health` |
| **总计** | **76** | |
