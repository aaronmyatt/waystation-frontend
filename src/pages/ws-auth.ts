import m from 'mithril'
import { _events, dispatch } from '../shared/utils'

export const Auth: m.Component = {
  oninit(vnode) {
    vnode.state.mode = 'login'; // 'login' or 'register'
    vnode.state.email = '';
    vnode.state.password = '';
    vnode.state.passwordConfirm = '';
    vnode.state.validationError = '';
    vnode.state.showPassword = false;
    vnode.state.showPasswordConfirm = false;
  },
  view(vnode) {
    const isLogin = vnode.state.mode === 'login';

    const validateForm = () => {
      vnode.state.validationError = '';
      
      if (!vnode.state.email) {
        vnode.state.validationError = 'Email is required';
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(vnode.state.email)) {
        vnode.state.validationError = 'Please enter a valid email address';
        return false;
      }
      
      if (!vnode.state.password) {
        vnode.state.validationError = 'Password is required';
        return false;
      }
      
      if (!isLogin) {
        if (vnode.state.password.length < 8) {
          vnode.state.validationError = 'Password must be at least 8 characters';
          return false;
        }
        
        if (vnode.state.password !== vnode.state.passwordConfirm) {
          vnode.state.validationError = 'Passwords do not match';
          return false;
        }
      }
      
      return true;
    };

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }

      globalThis.authService.clearMessages();
      
      const formData = {
        email: vnode.state.email,
        password: vnode.state.password,
      };

      if (isLogin) {
        dispatch(_events.auth.login, formData);
      } else {
        dispatch(_events.auth.register, formData);
      }
    };

    const resetForm = () => {
      vnode.state.email = '';
      vnode.state.password = '';
      vnode.state.passwordConfirm = '';
      vnode.state.validationError = '';
      globalThis.authService.reset();
    };

    const toggleMode = () => {
      resetForm();
      vnode.state.mode = isLogin ? 'register' : 'login';
    };

    return m('.auth-component.container mx-auto max-w-md', [
      m('.card w-full bg-base-100 shadow-xl border border-base-300', [
        m('.card-body', [
          // Title
          m('h2.card-title text-2xl font-bold text-center justify-center mb-4',
            isLogin ? 'Sign In' : 'Create Account'
          ),

          // Error Alert
          (vnode.state.validationError || globalThis.authService.error) &&
            m('.alert alert-error mb-4', [
              m('svg.stroke-current flex-shrink-0 h-6 w-6',
                { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24' },
                m('path',
                  {
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    'stroke-width': '2',
                    d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
                  }
                )
              ),
              m('span', vnode.state.validationError || globalThis.authService.error),
            ]),

          // Success Alert
          globalThis.authService.success &&
            m('.alert alert-success mb-4', [
              m('svg.stroke-current flex-shrink-0 h-6 w-6',
                { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24' },
                m('path',
                  {
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    'stroke-width': '2',
                    d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                  }
                )
              ),
              m('span', globalThis.authService.success),
            ]),

          // Form
          m('form', { onsubmit: handleSubmit }, [
            // Email Field
            m('.mb-4', [
              m('label.input w-full', 
                [
                  m('input', {
                      type: 'email',
                      placeholder: 'you@example.com',
                      value: vnode.state.email,
                      oninput: (e) => {
                    vnode.state.email = e.target.value;
                    vnode.state.validationError = '';
                  },
                  disabled: globalThis.authService.loading,
                  required: true,
                }),
                m('span.label', 'Email'),
              ]),
            ]),



            // Password Field
            m('.mb-4', [
              m('label.input input-bordered flex items-center gap-2 w-full',
                [
                  m('input.grow', {
                    type: vnode.state.showPassword ? 'text' : 'password',
                    placeholder: isLogin ? 'Enter your password' : 'At least 8 characters',
                    value: vnode.state.password,
                    oninput: (e) => {
                      vnode.state.password = e.target.value;
                      vnode.state.validationError = '';
                    },
                    disabled: globalThis.authService.loading,
                    required: true,
                  }),
                  m('button.btn btn-ghost btn-sm btn-circle', {
                    type: 'button',
                    onclick: () => {
                      vnode.state.showPassword = !vnode.state.showPassword;
                    },
                    tabIndex: -1,
                  }, vnode.state.showPassword ? '🙈' : '👁️'),
                  m('span.label', 'Password'),
                ]),
            ]),

            // Confirm Password Field (Register only)
            !isLogin &&
              m('.mb-4', [
                m('label.input input-bordered flex items-center gap-2 w-full',
                  [
                    m('input.grow', {
                      type: vnode.state.showPasswordConfirm ? 'text' : 'password',
                      placeholder: 'Re-enter your password',
                      value: vnode.state.passwordConfirm,
                      oninput: (e) => {
                        vnode.state.passwordConfirm = e.target.value;
                        vnode.state.validationError = '';
                      },
                      disabled: globalThis.authService.loading,
                      required: true,
                    }),
                    m('button.btn btn-ghost btn-sm btn-circle', {
                      type: 'button',
                      onclick: () => {
                        vnode.state.showPasswordConfirm = !vnode.state.showPasswordConfirm;
                      },
                      tabIndex: -1,
                    }, vnode.state.showPasswordConfirm ? '🙈' : '👁️'),
                    m('span.label', 'Confirm Password'),
                  ]),
              ]),


            // Submit Button
            m('.form-control mt-6', [
              m('button.btn btn-primary', {
                type: 'submit',
                disabled: globalThis.authService.loading,
                class: globalThis.authService.loading ? 'loading' : '',
              }, isLogin ? 'Sign In' : 'Create Account'),
            ]),

          ]),

          // Divider
          m('.divider', 'OR'),

          // Toggle Mode Link
          m('.text-center', [
            m('span.text-sm',
              isLogin ? "Don't have an account? " : 'Already have an account? '
            ),
            m('a.link link-primary text-sm', {
              onclick: toggleMode,
            }, isLogin ? 'Sign Up' : 'Sign In'),
          ]),
        ]),
      ]),
    ]);
  },
};
