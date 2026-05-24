<template>
  <view class="container">
    <view class="header">
      <view class="logo">🏫</view>
      <view class="title">学校管理系统</view>
      <view class="subtitle">家长/学生端</view>
    </view>

    <!-- 微信登录（仅小程序） -->
    <!-- #ifdef MP-WEIXIN -->
    <view v-if="!showBind" class="login-box">
      <button class="wechat-btn" :loading="isLoading" @click="handleWechatLogin">
        微信一键登录
      </button>
      <view class="tip">点击上方按钮，授权微信登录</view>
    </view>
    <!-- #endif -->

    <!-- 账号密码登录（APP / H5） -->
    <!-- #ifndef MP-WEIXIN -->
    <view v-if="!showBind" class="login-box">
      <view class="form-card">
        <view class="form-title">账号登录</view>

        <!-- 角色切换 -->
        <view class="role-tabs">
          <view class="role-tab" :class="{ active: loginRole === 'student' }" @click="loginRole = 'student'">
            学生
          </view>
          <view class="role-tab" :class="{ active: loginRole === 'parent' }" @click="loginRole = 'parent'">
            家长
          </view>
        </view>

        <view class="input-group">
          <input class="input" v-model="loginId" :placeholder="loginRole === 'student' ? '请输入学号' : '请输入手机号'" />
        </view>
        <view class="input-group">
          <input class="input" v-model="password" type="password" placeholder="请输入密码" />
        </view>
        <button class="login-btn" :loading="isLoading" @click="handlePasswordLogin">
          登录
        </button>
      </view>
    </view>
    <!-- #endif -->

    <!-- 绑定账号 -->
    <view v-if="showBind" class="bind-box">
      <view class="bind-title">绑定账号</view>
      <view class="bind-desc">首次登录，请绑定您的身份信息</view>

      <view class="bind-type">
        <view class="type-item" :class="{ active: bindType === 'student_no' }" @click="bindType = 'student_no'">
          <view>学生</view>
          <view class="type-desc">通过学号绑定</view>
        </view>
        <view class="type-item" :class="{ active: bindType === 'parent_phone' }" @click="bindType = 'parent_phone'">
          <view>家长</view>
          <view class="type-desc">通过手机号绑定</view>
        </view>
      </view>

      <view class="input-group">
        <input class="input" v-model="bindValue" :placeholder="bindType === 'student_no' ? '请输入学号' : '请输入手机号'" />
      </view>

      <button class="bind-btn" type="primary" :loading="isLoading" @click="handleBind">
        确认绑定
      </button>
      <view class="skip-link" @click="handleSkip">稍后绑定</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { store } from '../../store/index.js'
import { api } from '../../utils/api.js'

const isLoading = ref(false)
const showBind = ref(false)
const tempToken = ref('')
const bindType = ref('student_no')
const bindValue = ref('')
const loginRole = ref('student')
const loginId = ref('')
const password = ref('')

onLoad(() => {
  if (store.checkLogin()) {
    uni.switchTab({ url: '/pages/index/index' })
  }
})

// 微信登录（小程序）
function handleWechatLogin() {
  isLoading.value = true
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      if (!res.code) {
        uni.showToast({ title: '获取微信授权失败', icon: 'none' })
        isLoading.value = false
        return
      }
      try {
        const result = await api.post('/auth/wechat-login', { code: res.code })
        if (result.isNewUser) {
          showBind.value = true
          tempToken.value = result.tempToken
          isLoading.value = false
        } else {
          store.setAuth(result.tokens.accessToken, result.tokens.refreshToken, result.user)
          uni.switchTab({ url: '/pages/index/index' })
        }
      } catch (err) {
        uni.showToast({ title: err.message || '登录失败', icon: 'none', duration: 3000 })
        isLoading.value = false
      }
    },
    fail: (err) => {
      uni.showToast({ title: 'uni.login失败: ' + (err.errMsg || '未知'), icon: 'none', duration: 3000 })
      isLoading.value = false
    },
  })
}

// 账号密码登录（APP/H5）
async function handlePasswordLogin() {
  if (!loginId.value.trim()) {
    uni.showToast({ title: loginRole.value === 'student' ? '请输入学号' : '请输入手机号', icon: 'none' })
    return
  }
  if (!password.value.trim()) { uni.showToast({ title: '请输入密码', icon: 'none' }); return }

  isLoading.value = true
  try {
    const result = await api.post('/auth/mobile-login', {
      loginId: loginId.value.trim(),
      password: password.value,
    })
    store.setAuth(result.tokens.accessToken, result.tokens.refreshToken, result.user)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (err) {
    uni.showToast({ title: err.message || '登录失败', icon: 'none', duration: 3000 })
    isLoading.value = false
  }
}

// 提交绑定
async function handleBind() {
  if (!bindValue.value.trim()) {
    uni.showToast({ title: bindType.value === 'student_no' ? '请输入学号' : '请输入手机号', icon: 'none' })
    return
  }
  isLoading.value = true
  try {
    const result = await api.post('/auth/bind', {
      tempToken: tempToken.value,
      bindType: bindType.value,
      bindValue: bindValue.value.trim(),
    })
    store.setAuth(result.tokens.accessToken, result.tokens.refreshToken, result.user)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (err) {
    uni.showToast({ title: err.message || '绑定失败', icon: 'none' })
    isLoading.value = false
  }
}

function handleSkip() {
  store.logout()
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  padding: 80rpx 40rpx;
}
.header { text-align: center; margin-bottom: 80rpx; }
.logo { font-size: 120rpx; margin-bottom: 20rpx; }
.title { font-size: 44rpx; font-weight: bold; color: #fff; margin-bottom: 12rpx; }
.subtitle { font-size: 28rpx; color: rgba(255,255,255,0.8); }

/* 微信登录 */
.login-box { width: 100%; display: flex; flex-direction: column; align-items: center; }
.wechat-btn {
  width: 500rpx; height: 96rpx; line-height: 96rpx;
  background: #fff; color: #1677ff; font-size: 32rpx;
  font-weight: bold; border-radius: 48rpx; border: none;
}
.tip { margin-top: 24rpx; font-size: 24rpx; color: rgba(255,255,255,0.7); }

/* 账号密码登录 */
.form-card { width: 100%; background: #fff; border-radius: 16rpx; padding: 48rpx 40rpx; }
.form-title { font-size: 36rpx; font-weight: bold; color: #333; text-align: center; margin-bottom: 32rpx; }
.role-tabs { display: flex; gap: 0; margin-bottom: 32rpx; border-radius: 12rpx; overflow: hidden; border: 2rpx solid #1677ff; }
.role-tab {
  flex: 1; text-align: center; padding: 16rpx 0; font-size: 28rpx;
  color: #1677ff; background: #fff; transition: all 0.2s;
}
.role-tab.active { color: #fff; background: #1677ff; }
.input-group { margin-bottom: 28rpx; }
.input {
  width: 100%; height: 88rpx; border: 2rpx solid #e8e8e8;
  border-radius: 12rpx; padding: 0 24rpx; font-size: 30rpx; box-sizing: border-box;
}
.login-btn {
  width: 100%; height: 88rpx; line-height: 88rpx;
  background: #1677ff; color: #fff; font-size: 32rpx;
  font-weight: bold; border-radius: 12rpx; border: none; margin-top: 12rpx;
}

/* 绑定 */
.bind-box { width: 100%; background: #fff; border-radius: 16rpx; padding: 48rpx 40rpx; }
.bind-title { font-size: 36rpx; font-weight: bold; color: #333; text-align: center; margin-bottom: 12rpx; }
.bind-desc { font-size: 26rpx; color: #999; text-align: center; margin-bottom: 40rpx; }
.bind-type { display: flex; gap: 20rpx; margin-bottom: 40rpx; }
.type-item {
  flex: 1; text-align: center; padding: 24rpx;
  border: 2rpx solid #e8e8e8; border-radius: 12rpx; font-size: 28rpx; color: #666;
}
.type-item.active { border-color: #1677ff; background: #e6f4ff; color: #1677ff; }
.type-desc { font-size: 22rpx; color: #999; margin-top: 6rpx; }
.bind-btn { width: 100%; height: 88rpx; line-height: 88rpx; border-radius: 12rpx; }
.skip-link { text-align: center; margin-top: 24rpx; font-size: 26rpx; color: #999; }
</style>
